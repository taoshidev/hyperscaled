import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { registrations, entityMiners } from "@/lib/db/schema";
import { flushErrors, reportCritical, reportError, reportWarning } from "@/lib/errors";
import { parseErrorBody } from "@/lib/parse-error-body";
import { errorText } from "@/lib/registrations/retry-result-text";

/**
 * Re-drive `pending` registrations against their entity miner.
 *
 * A registration lands in `pending` when the payment settled but the miner
 * refused `create-hl-subaccount` (miner API error / unreachable). This module
 * is the single implementation behind:
 *   - `POST|GET /api/register/retry`  (bearer-protected; Vercel cron + CLI)
 *   - the Command Center "Retry" actions (`app/actions/registrations.js`)
 *
 * Concurrency: the cron (every 15 min) and staff clicks can overlap, and the
 * miner rejects a second `create-hl-subaccount` for an address it just
 * accepted ("already registered to subaccount"). Guards:
 *   1. one run at a time — a transaction-scoped Postgres advisory lock held
 *      on a dedicated connection for the whole run (kept alive with a
 *      heartbeat); a second caller gets `retry_already_running`;
 *   2. compare-and-set — every status write is conditional on the row still
 *      being `pending` (a miner success may also repair a `failed` row), and
 *      a lost CAS re-reads the row so the operator sees its real status;
 *   3. the `registered` write is retried with backoff: it is the one write
 *      whose loss turns a provisioned account into a mislabelled row.
 *
 * Outcomes per row:
 *   registered     — miner accepted; row flips to `registered`
 *   failed         — miner says the HL address is already registered to a
 *                    subaccount; row flips to `failed` for admin review
 *   still_pending  — miner error / unreachable; `status_detail` refreshed
 *   skipped        — no miner API URL, miner already unreachable this run,
 *                    or the row changed / vanished under us (reason says which)
 *   db_error       — the row's own DB write failed; the run continues
 *
 * Alerting: miner errors are aggregated into ONE report per (reason, status,
 * miner) per run, so a collateral outage does not page once per row every
 * 15 minutes. The duplicate-guard demotion stays a per-row alert because it
 * happens exactly once per row.
 */

function envInt(name, fallback) {
  const n = parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Stop before the hosting platform kills the function. Override with
// RETRY_BUDGET_MS (default 55s for Vercel Pro; set ~8s on Hobby).
export const DEFAULT_RETRY_BUDGET_MS = envInt("RETRY_BUDGET_MS", 55_000);

// Cap on a single miner round-trip so one hung miner cannot eat the budget.
export const MINER_TIMEOUT_MS = envInt("RETRY_MINER_TIMEOUT_MS", 15_000);

// Arbitrary but stable key for pg_try_advisory_xact_lock; must not collide
// with other advisory locks in this app (track/click uses hashtext keys).
export const RETRY_ADVISORY_LOCK_KEY = 720_260_904;

// Keep the lock connection out of `idle in transaction` while the loop
// runs on the pool (some hosts kill idle transactions after a few seconds).
export const LOCK_HEARTBEAT_MS = 10_000;

// The `registered` write gets more than one chance (see header).
const REGISTERED_WRITE_ATTEMPTS = 3;
const REGISTERED_WRITE_BACKOFF_MS = [250, 1_000];

export const RETRY_ALREADY_RUNNING = "retry_already_running";

function sanitizeApiKey(key) {
  if (key == null) return null;
  const t = String(key)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  return t || null;
}

/** Prefer DB (entity_miners.api_key); env only when DB has no key. */
export function resolveMinerApiKey(miner) {
  const fromDb = sanitizeApiKey(miner.apiKey);
  if (fromDb) return fromDb;
  const slugEnv = `ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`;
  return sanitizeApiKey(process.env[slugEnv]) || sanitizeApiKey(process.env.ENTITY_MINER_API_KEY) || null;
}

/**
 * Vanta entity miner (vanta-network EntityMinerRestServer) only reads
 * `Authorization` (Bearer + key, or raw key). Keys must exist in the miner's
 * api_keys.json.
 */
async function postCreateHlSubaccount(fetchImpl, baseUrl, payload, apiKey, timeoutMs) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return fetchImpl(`${baseUrl}/api/create-hl-subaccount`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/** Stable, log-safe code for a failed fetch (the raw message goes to logs). */
export function classifyFetchError(err) {
  if (!err) return "network_error";
  if (err.name === "TimeoutError" || err.name === "AbortError") return "timeout";
  if (typeof err.code === "string" && err.code) return err.code;
  if (err.cause && typeof err.cause.code === "string" && err.cause.code) return err.cause.code;
  return "network_error";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn` while holding the retry advisory lock. The lock lives on a
 * dedicated transaction/connection for the whole run; the run itself keeps
 * using the pool so each row's update commits immediately (a mid-run kill
 * must never roll back rows the miner already accepted). A heartbeat keeps
 * that connection from sitting `idle in transaction`.
 *
 * If the lock transaction fails AFTER `fn` resolved (commit/rollback of a
 * dropped connection), the run's results are still returned — they are
 * already committed through the pool — and the loss is reported as a
 * warning rather than as a failed start.
 *
 * Resolves to `{ acquired: false }` when another run holds the lock.
 */
async function withRetryLock(db, fn, { source, logMeta } = {}) {
  let value;
  let ran = false;
  try {
    return await db.transaction(async (tx) => {
      const res = await tx.execute(sql`select pg_try_advisory_xact_lock(${RETRY_ADVISORY_LOCK_KEY}) as locked`);
      const row = Array.isArray(res) ? res[0] : res?.rows?.[0];
      if (!row?.locked) return { acquired: false };

      const heartbeat = setInterval(() => {
        tx.execute(sql`select 1`).catch((err) => {
          console.warn("[REGISTRATION][retry] lock heartbeat failed", { ...logMeta, error: err?.message });
        });
      }, LOCK_HEARTBEAT_MS);
      try {
        value = await fn();
        ran = true;
        return { acquired: true, value };
      } finally {
        clearInterval(heartbeat);
      }
    });
  } catch (err) {
    if (ran) {
      reportWarning("retry_lock_lost_after_run", {
        source,
        metadata: { step: "retry_lock_lost", ...logMeta, error: err?.message },
      });
      return { acquired: true, value };
    }
    throw err;
  }
}

function extractStatusDetailCarryOver(detail) {
  // Keys written at registration time that later screens depend on
  // (payment method drives the tx explorer link, coupon keys drive support).
  if (!detail || typeof detail !== "object") return {};
  const { reason: _r, error: _e, apiStatus: _s, note: _n, ...rest } = detail;
  return rest;
}

/**
 * @param {object} db drizzle db handle (from `getDb()`)
 * @param {object} [options]
 * @param {number[]|null} [options.ids] restrict to these registration ids (still must be `pending`)
 * @param {number} [options.budgetMs] wall-clock budget; rows left unprocessed are reported via `budgetExhausted`
 * @param {string} [options.reqId] correlation id for logs
 * @param {string} [options.source] `reportError` source tag
 * @param {string|null} [options.actor] who triggered the run (staff wallet, "cron", "bearer") — logged only
 * @param {typeof fetch} [options.fetchImpl] injectable for tests
 * @param {() => number} [options.now] injectable clock for tests
 * @param {(ms:number) => Promise<void>} [options.sleepImpl] injectable backoff for tests
 * @param {(db, fn, ctx) => Promise<{acquired:boolean, value?:any}>} [options.lock] injectable mutex for tests
 * @returns {Promise<{ok:true, retried:number, results:object[], budgetExhausted:boolean} | {ok:false, error:string}>}
 */
export async function retryPendingRegistrations(db, options = {}) {
  const {
    ids = null,
    budgetMs = DEFAULT_RETRY_BUDGET_MS,
    reqId = Math.random().toString(36).slice(2, 10),
    source = "registrations/retry-pending",
    actor = null,
    fetchImpl = fetch,
    now = Date.now,
    sleepImpl = sleep,
    lock = withRetryLock,
  } = options;

  const logMeta = { reqId, actor };

  let locked;
  try {
    locked = await lock(db, () => runRetry(db, { ids, budgetMs, source, fetchImpl, now, sleepImpl, logMeta }), {
      source,
      logMeta,
    });
  } catch (err) {
    reportCritical(err, {
      source,
      metadata: { step: "acquire_retry_lock", ...logMeta },
    });
    await flushErrors();
    return { ok: false, error: "Failed to start the retry run" };
  }

  if (!locked.acquired) {
    console.info("[REGISTRATION][retry] another run holds the lock — skipping", logMeta);
    return { ok: false, error: RETRY_ALREADY_RUNNING };
  }
  return locked.value;
}

async function runRetry(db, { ids, budgetMs, source, fetchImpl, now, sleepImpl, logMeta }) {
  const startedAt = now();

  const where = ids
    ? and(eq(registrations.status, "pending"), inArray(registrations.id, ids))
    : eq(registrations.status, "pending");

  let pending;
  try {
    // Least-recently-attempted first: updated_at moves on every failed
    // attempt, so a row that keeps failing rotates behind fresh ones.
    pending = await db
      .select()
      .from(registrations)
      .where(where)
      .orderBy(asc(registrations.updatedAt), asc(registrations.id));
  } catch (err) {
    reportCritical(err, {
      source,
      metadata: { step: "load_pending_registrations", ...logMeta },
    });
    await flushErrors();
    return { ok: false, error: "Failed to load pending registrations" };
  }

  console.info("[REGISTRATION][retry] pending count", { ...logMeta, pendingCount: pending.length, ids });
  if (pending.length === 0) {
    return { ok: true, retried: 0, results: [], budgetExhausted: false };
  }

  // Batch-load all miners we need
  const hotkeySet = [...new Set(pending.map((r) => r.minerHotkey))];
  const miners = {};
  for (const hotkey of hotkeySet) {
    try {
      const [miner] = await db
        .select()
        .from(entityMiners)
        .where(eq(entityMiners.hotkey, hotkey))
        .limit(1);
      if (miner) miners[hotkey] = miner;
    } catch (err) {
      reportError(err, {
        source,
        metadata: { step: "load_miner", ...logMeta, hotkey },
      });
    }
  }

  const results = [];
  const unreachableMiners = new Set();
  /** Aggregated miner failures → one alert per group at the end of the run. */
  const alertGroups = new Map();
  let budgetExhausted = false;

  function recordAlert(reason, reg, apiStatus, sample) {
    const key = `${reason}|${apiStatus ?? ""}|${reg.minerHotkey}`;
    const g = alertGroups.get(key) ?? { reason, apiStatus: apiStatus ?? null, minerHotkey: reg.minerHotkey, regIds: [], sample };
    g.regIds.push(reg.id);
    alertGroups.set(key, g);
  }

  /**
   * Conditional status write. Returns true when this run owned the
   * transition, false when another writer already moved the row.
   */
  async function casUpdate(reg, values, allowedStatuses) {
    const updated = await db
      .update(registrations)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(registrations.id, reg.id), inArray(registrations.status, allowedStatuses)))
      .returning({ id: registrations.id });
    return Array.isArray(updated) && updated.length > 0;
  }

  /** The row changed under us: report what it is now instead of guessing. */
  async function lostCas(reg) {
    let currentStatus = null;
    try {
      const [row] = await db
        .select({ status: registrations.status })
        .from(registrations)
        .where(eq(registrations.id, reg.id))
        .limit(1);
      currentStatus = row?.status ?? null;
    } catch {
      /* best effort */
    }
    console.info("[REGISTRATION][retry] row changed under us — leaving it", {
      ...logMeta,
      regId: reg.id,
      currentStatus,
    });
    return currentStatus
      ? { id: reg.id, hlAddress: reg.hlAddress, status: "skipped", reason: "row_changed", currentStatus }
      : { id: reg.id, hlAddress: reg.hlAddress, status: "skipped", reason: "row_missing" };
  }

  /** Is there another registered row for this address at this miner? */
  async function otherRegisteredRowExists(reg) {
    try {
      const rows = await db
        .select({ id: registrations.id })
        .from(registrations)
        .where(
          and(
            eq(registrations.status, "registered"),
            eq(registrations.minerHotkey, reg.minerHotkey),
            sql`lower(${registrations.hlAddress}) = ${String(reg.hlAddress).toLowerCase()}`,
            ne(registrations.id, reg.id),
          ),
        )
        .limit(1);
      return rows.length > 0;
    } catch {
      return null; // unknown
    }
  }

  for (const reg of pending) {
    const elapsed = now() - startedAt;
    if (elapsed > budgetMs) {
      budgetExhausted = true;
      console.warn("[REGISTRATION][retry] budget exhausted — remaining rows deferred", {
        ...logMeta,
        processed: results.length,
        total: pending.length,
      });
      break;
    }

    const miner = miners[reg.minerHotkey];
    if (!miner || !miner.apiUrl) {
      console.warn("[REGISTRATION][retry] skipping — miner has no apiUrl", {
        ...logMeta,
        regId: reg.id,
        minerHotkey: reg.minerHotkey,
      });
      results.push({ id: reg.id, hlAddress: reg.hlAddress, status: "skipped", reason: "no_miner_api" });
      continue;
    }

    if (unreachableMiners.has(reg.minerHotkey)) {
      results.push({
        id: reg.id,
        hlAddress: reg.hlAddress,
        status: "skipped",
        reason: "miner_unreachable_this_run",
      });
      continue;
    }

    const carryOver = extractStatusDetailCarryOver(reg.statusDetail);
    const apiKey = resolveMinerApiKey(miner);
    const baseUrl = miner.apiUrl.replace(/\/+$/, "");
    const timeoutMs = Math.max(1_000, Math.min(MINER_TIMEOUT_MS, budgetMs - elapsed));

    let res;
    try {
      console.info("[REGISTRATION][retry] calling miner API", {
        ...logMeta,
        regId: reg.id,
        baseUrl,
        hlAddress: reg.hlAddress,
        hasApiKey: Boolean(apiKey),
        timeoutMs,
      });
      res = await postCreateHlSubaccount(
        fetchImpl,
        baseUrl,
        {
          hl_address: reg.hlAddress,
          account_size: reg.accountSize,
          payout_address: reg.payoutAddress,
        },
        apiKey,
        timeoutMs,
      );
    } catch (err) {
      unreachableMiners.add(reg.minerHotkey);
      const code = classifyFetchError(err);
      const detail = { ...carryOver, reason: "miner_api_unreachable", error: { code, message: err.message } };
      console.error("[REGISTRATION][retry] miner API unreachable", {
        ...logMeta,
        regId: reg.id,
        code,
        error: err.message,
      });
      recordAlert("miner_api_unreachable", reg, null, { code, message: err.message, apiUrl: miner.apiUrl });
      try {
        const owned = await casUpdate(reg, { statusDetail: detail }, ["pending"]);
        results.push(
          owned
            ? { id: reg.id, hlAddress: reg.hlAddress, status: "still_pending", reason: "miner_api_unreachable", error: code }
            : await lostCas(reg),
        );
      } catch (dbErr) {
        results.push(dbErrorResult(reg, dbErr, source, logMeta, "write_unreachable"));
      }
      continue;
    }

    try {
      if (res.ok) {
        const minerResponseBody = await res.json().catch((err) => {
          console.warn("[REGISTRATION][retry] miner API returned 200 with unparseable JSON body", {
            ...logMeta,
            regId: reg.id,
            error: err?.message,
          });
          return null;
        });
        // A miner success is authoritative: it may also repair a row a
        // concurrent run marked `failed` on the duplicate guard. It is also
        // the one write we must not lose, so it gets a few attempts.
        const values = {
          status: "registered",
          statusDetail: Object.keys(carryOver).length ? carryOver : null,
          metadata: minerResponseBody,
        };
        let owned = null;
        let lastErr = null;
        for (let attempt = 1; attempt <= REGISTERED_WRITE_ATTEMPTS; attempt += 1) {
          try {
            owned = await casUpdate(reg, values, ["pending", "failed"]);
            lastErr = null;
            break;
          } catch (dbErr) {
            lastErr = dbErr;
            console.warn("[REGISTRATION][retry] registered write failed — retrying", {
              ...logMeta,
              regId: reg.id,
              attempt,
              error: dbErr?.message,
            });
            if (attempt < REGISTERED_WRITE_ATTEMPTS) {
              await sleepImpl(REGISTERED_WRITE_BACKOFF_MS[attempt - 1] ?? 1_000);
            }
          }
        }
        if (lastErr) {
          // Miner accepted but we could not record it: say so loudly. The
          // next run will hit the duplicate guard for this row.
          results.push(dbErrorResult(reg, lastErr, source, logMeta, "write_registered", { minerAccepted: true }));
          continue;
        }
        if (!owned) {
          results.push(await lostCas(reg));
          continue;
        }
        console.info("[REGISTRATION][retry] marked registered", { ...logMeta, regId: reg.id });
        results.push({ id: reg.id, hlAddress: reg.hlAddress, status: "registered" });
        continue;
      }

      const errText = await res.text().catch(() => "");
      const parsedError = parseErrorBody(errText);

      // Miner-side duplicate guard. Don't silently re-attribute a
      // pre-existing subaccount to this row's user/payment — surface to
      // admin for refund/investigation.
      if (res.status === 400 && errText.includes("already registered to subaccount")) {
        const otherRow = await otherRegisteredRowExists(reg);
        const note =
          otherRow === false
            ? "No other registered row exists for this address at this miner in this database. The miner-side subaccount may be this registration's own earlier accepted attempt whose DB write was lost, or a registration made through another deployment that shares the miner. Verify at the miner before refunding."
            : otherRow === true
              ? "Another registered row exists for this address at this miner; this looks like a duplicate payment."
              : undefined;
        const detail = {
          ...carryOver,
          reason: "already_registered_at_miner",
          apiStatus: res.status,
          error: parsedError,
          ...(note ? { note } : {}),
        };
        const owned = await casUpdate(reg, { status: "failed", statusDetail: detail }, ["pending"]);
        if (!owned) {
          results.push(await lostCas(reg));
          continue;
        }
        console.warn("[REGISTRATION][retry] miner reports address already registered — marking failed for admin review", {
          ...logMeta,
          regId: reg.id,
          hlAddress: reg.hlAddress,
          otherRegisteredRow: otherRow,
        });
        reportError(new Error("retry_already_registered_at_miner"), {
          source,
          metadata: {
            step: "already_registered_at_miner",
            ...logMeta,
            regId: reg.id,
            minerHotkey: reg.minerHotkey,
            hlAddress: reg.hlAddress,
            otherRegisteredRow: otherRow,
            errText: errText.slice(0, 500),
          },
        });
        results.push({
          id: reg.id,
          hlAddress: reg.hlAddress,
          status: "failed",
          reason: "already_registered_at_miner",
          error: errorText(parsedError),
          note,
        });
        continue;
      }

      const detail = { ...carryOver, reason: "miner_api_error", error: parsedError, apiStatus: res.status };
      const owned = await casUpdate(reg, { statusDetail: detail }, ["pending"]);
      if (!owned) {
        results.push(await lostCas(reg));
        continue;
      }
      console.warn("[REGISTRATION][retry] still pending — miner API error", {
        ...logMeta,
        regId: reg.id,
        apiStatus: res.status,
        errText: errText.slice(0, 300),
      });
      recordAlert("miner_api_error", reg, res.status, { errText: errText.slice(0, 500) });
      results.push({
        id: reg.id,
        hlAddress: reg.hlAddress,
        status: "still_pending",
        reason: "miner_api_error",
        apiStatus: res.status,
        error: errorText(parsedError),
      });
    } catch (dbErr) {
      results.push(dbErrorResult(reg, dbErr, source, logMeta, "write_outcome"));
    }
  }

  // One alert per failure group per run (not one per row per cron tick).
  for (const g of alertGroups.values()) {
    reportError(new Error(`retry_${g.reason}`), {
      source,
      metadata: {
        step: g.reason,
        ...logMeta,
        minerHotkey: g.minerHotkey,
        apiStatus: g.apiStatus,
        rows: g.regIds.length,
        regIds: g.regIds.slice(0, 20),
        sample: g.sample,
      },
    });
  }

  console.info("[REGISTRATION][retry] processed batch", {
    ...logMeta,
    total: pending.length,
    processed: results.length,
    budgetExhausted,
    results,
  });

  await flushErrors();
  return { ok: true, retried: results.length, results, budgetExhausted };
}

function dbErrorResult(reg, err, source, logMeta, step, extra = {}) {
  console.error("[REGISTRATION][retry] DB write failed — continuing with next row", {
    ...logMeta,
    regId: reg.id,
    step,
    ...extra,
    error: err?.message,
  });
  reportError(err, {
    source,
    metadata: { step: `db_${step}`, ...logMeta, regId: reg.id, ...extra },
  });
  // Raw driver messages stay in logs; the operator gets a stable code.
  return { id: reg.id, hlAddress: reg.hlAddress, status: "db_error", error: "db_write_failed", ...extra };
}
