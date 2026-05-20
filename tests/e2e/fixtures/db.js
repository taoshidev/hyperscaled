import pg from "pg";

// E2E tests reach into the same Postgres instance the app uses so we
// can: (1) read the canonical tier list to assert against, (2) seed
// pre-existing registration/user rows for stale-pending and
// duplicate-registration scenarios, and (3) clean up rows we created.
//
// We open a dedicated, low-pool client so we don't contend with the
// running dev server's pool.

let _pool = null;

function getDatabaseUrl() {
  const url = process.env.E2E_DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "E2E tests require E2E_DATABASE_URL or DATABASE_URL to be set.",
    );
  }
  return url;
}

export function getPool() {
  if (_pool) return _pool;
  _pool = new pg.Pool({ connectionString: getDatabaseUrl(), max: 2 });
  return _pool;
}

export async function closePool() {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

/**
 * Returns the active tiers for a given miner slug, ordered by
 * account size ascending. This matches what `/api/miners/[slug]`
 * returns to the wizard, which is what `<StepSelectTier>` renders.
 */
export async function loadActiveTiersBySlug(slug = "vanta") {
  const { rows } = await getPool().query(
    `SELECT t.id, t.account_size, t.price_usdc, t.profit_split, t.is_active
       FROM entity_tiers t
       JOIN entity_miners m ON m.hotkey = t.hotkey
      WHERE m.slug = $1 AND t.is_active = true
      ORDER BY t.account_size ASC`,
    [slug],
  );
  return rows.map((r) => ({
    id: r.id,
    accountSize: Number(r.account_size),
    priceUsdc: r.price_usdc,
    profitSplit: r.profit_split,
    isActive: r.is_active,
  }));
}

export async function getMinerHotkeyBySlug(slug) {
  const { rows } = await getPool().query(
    `SELECT hotkey FROM entity_miners WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  return rows[0]?.hotkey ?? null;
}

/**
 * Hard-clean every row associated with a wallet so each test starts
 * from a known-empty state. Order matters because of the FK from
 * registrations.user_id → users.id.
 */
export async function purgeWallet(address) {
  const lower = String(address).toLowerCase();
  const pool = getPool();

  // Match either case (DB stored values may vary across writes).
  await pool.query(
    `DELETE FROM registrations WHERE LOWER(hl_address) = $1
                                 OR LOWER(payout_address) = $1`,
    [lower],
  );
  await pool.query(
    `DELETE FROM users WHERE LOWER(wallet) = $1`,
    [lower],
  );
}

export async function purgeWallets(addresses) {
  for (const addr of addresses) await purgeWallet(addr);
}

/**
 * Seed an existing registration row so we can exercise the
 * duplicate-registration / stale-pending guards. Returns the inserted
 * id.
 */
export async function seedRegistration({
  hlAddress,
  minerSlug = "vanta",
  status = "registered",
  accountSize = 25000,
  tierIndex = 0,
  priceUsdc = "119.00",
  txHash = null,
  payoutAddress = null,
  metadata = null,
}) {
  const hotkey = await getMinerHotkeyBySlug(minerSlug);
  if (!hotkey) {
    throw new Error(
      `seedRegistration: miner slug=${minerSlug} not found. Run \`pnpm db:seed\`.`,
    );
  }

  // Ensure a `users` row exists keyed by hl_address so the
  // FK on registrations.user_id can be set.
  const lower = String(hlAddress).toLowerCase();
  const usersRes = await getPool().query(
    `INSERT INTO users (wallet, kyc_status)
     VALUES ($1, 'none')
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [lower],
  );
  let userId = usersRes.rows[0]?.id;
  if (!userId) {
    const { rows } = await getPool().query(
      `SELECT id FROM users WHERE LOWER(wallet) = $1 LIMIT 1`,
      [lower],
    );
    userId = rows[0]?.id ?? null;
  }

  const { rows } = await getPool().query(
    `INSERT INTO registrations (
       user_id, miner_hotkey, hl_address, account_size, payout_address,
       tier_index, price_usdc, tx_hash, status, metadata
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      userId,
      hotkey,
      hlAddress,
      accountSize,
      payoutAddress,
      tierIndex,
      priceUsdc,
      txHash,
      status,
      metadata,
    ],
  );
  return rows[0].id;
}

/**
 * Insert (or replace) a coupon row keyed by `code`. Used by E2E specs that
 * need a deterministic coupon to apply at checkout — e.g. verifying the
 * order summary stays stable across email edits when a 100% off promo is
 * already valid. Returns the coupon row's id.
 */
export async function upsertCoupon({
  code,
  discountType = "percent",
  discountValue = "100",
  useType = "multi_use",
  maxUses = null,
  validUntil = null,
  allowedEmails = null,
  allowedTierIds = null,
}) {
  const pool = getPool();
  // Delete any prior row with the same code so the test starts fresh —
  // including any redemptions that would block reuse.
  const { rows: existing } = await pool.query(
    `SELECT id FROM coupons WHERE code = $1`,
    [code],
  );
  for (const row of existing) {
    await pool.query(`DELETE FROM coupon_redemptions WHERE coupon_id = $1`, [
      row.id,
    ]);
    await pool.query(`DELETE FROM coupons WHERE id = $1`, [row.id]);
  }
  const { rows } = await pool.query(
    `INSERT INTO coupons (
       code, discount_type, discount_value, use_type, max_uses,
       valid_until, allowed_emails, allowed_tier_ids
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      code,
      discountType,
      String(discountValue),
      useType,
      maxUses,
      validUntil,
      allowedEmails == null ? null : JSON.stringify(allowedEmails),
      allowedTierIds == null ? null : JSON.stringify(allowedTierIds),
    ],
  );
  return rows[0].id;
}

export async function deleteCouponByCode(code) {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT id FROM coupons WHERE code = $1`,
    [code],
  );
  for (const row of rows) {
    await pool.query(`DELETE FROM coupon_redemptions WHERE coupon_id = $1`, [
      row.id,
    ]);
    await pool.query(`DELETE FROM coupons WHERE id = $1`, [row.id]);
  }
}

export async function getLatestRegistrationFor(hlAddress) {
  const lower = String(hlAddress).toLowerCase();
  const { rows } = await getPool().query(
    `SELECT id, status, account_size, tier_index, price_usdc, metadata,
            created_at, updated_at
       FROM registrations
      WHERE LOWER(hl_address) = $1
      ORDER BY id DESC
      LIMIT 1`,
    [lower],
  );
  return rows[0] ?? null;
}
