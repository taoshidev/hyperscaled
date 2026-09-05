"use server";

import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/index.js";
import { entityMiners, registrations } from "@/lib/db/schema";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";
import { RETRY_ALREADY_RUNNING, retryPendingRegistrations } from "@/lib/registrations/retry-pending";
import { reportError } from "@/lib/errors";

// Postgres `serial` is int4; anything above cannot be a registration id.
const MAX_REGISTRATION_ID = 2_147_483_647;
// Upper bound on a single explicit selection (the page shows 50 rows).
const MAX_RETRY_SELECTION = 500;
import {
  REGISTRATIONS_ADMIN_PAGE_SIZE,
  REGISTRATIONS_ADMIN_STATUS_FILTERS,
  parseRegistrationsAdminStatus,
} from "@/lib/admin/registrations-command-center";

function toIso(value) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function serializeRow(row) {
  return {
    id: row.id,
    hlAddress: row.hlAddress,
    payerAddress: row.payerAddress ?? null,
    accountSize: row.accountSize,
    tierIndex: row.tierIndex,
    priceUsdc: row.priceUsdc == null ? null : String(row.priceUsdc),
    txHash: row.txHash ?? null,
    status: row.status,
    statusDetail: row.statusDetail ?? null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    minerHotkey: row.minerHotkey,
    minerName: row.minerName ?? null,
    minerSlug: row.minerSlug ?? null,
  };
}

/**
 * Registrations that need a human: `pending` (miner refused / unreachable
 * after payment) and `failed` (miner says the address is already registered).
 */
export async function listAdminRegistrationsPage(options = {}) {
  await requireCommandCenterStaff();
  const db = await getDb();

  const status = parseRegistrationsAdminStatus(options.status);
  const pageSize = REGISTRATIONS_ADMIN_PAGE_SIZE;
  const where = inArray(registrations.status, REGISTRATIONS_ADMIN_STATUS_FILTERS[status]);

  // Count first so the requested page can be clamped to what exists; an
  // unbounded OFFSET is both a wasted query and, for absurd values, a
  // Postgres error.
  const [countRow] = await db
    .select({ count: sql`count(*)::int` })
    .from(registrations)
    .where(where);
  const total = Number(countRow?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requested = Number.parseInt(options.page ?? 1, 10);
  const page = Math.min(Number.isSafeInteger(requested) && requested > 0 ? requested : 1, totalPages);

  const rows = await db
    .select({
        id: registrations.id,
        hlAddress: registrations.hlAddress,
        payerAddress: registrations.payerAddress,
        accountSize: registrations.accountSize,
        tierIndex: registrations.tierIndex,
        priceUsdc: registrations.priceUsdc,
        txHash: registrations.txHash,
        status: registrations.status,
        statusDetail: registrations.statusDetail,
        createdAt: registrations.createdAt,
        updatedAt: registrations.updatedAt,
        minerHotkey: registrations.minerHotkey,
        minerName: entityMiners.name,
        minerSlug: entityMiners.slug,
      })
      .from(registrations)
      .leftJoin(entityMiners, eq(entityMiners.hotkey, registrations.minerHotkey))
      .where(where)
      .orderBy(desc(registrations.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

  return {
    rows: rows.map(serializeRow),
    total,
    page,
    pageSize,
    status,
  };
}

/** Count of `pending` rows, independent of the active tab (drives the Retry-all button). */
export async function countPendingRegistrations() {
  await requireCommandCenterStaff();
  const db = await getDb();
  const [row] = await db
    .select({ count: sql`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.status, "pending"));
  return Number(row?.count ?? 0);
}

/**
 * Re-drive pending registrations through the miner.
 *
 * @param {{ids?: number[]}} [input] omit `ids` to retry every pending row.
 */
export async function retryRegistrations(input = {}) {
  const staff = await requireCommandCenterStaff();

  let ids = null;
  if (input && input.ids !== undefined && input.ids !== null) {
    if (!Array.isArray(input.ids)) {
      return { success: false, error: "Invalid selection." };
    }
    if (input.ids.length > MAX_RETRY_SELECTION) {
      return { success: false, error: "Too many registrations selected." };
    }
    ids = [
      ...new Set(
        input.ids
          .map((v) => Number(v))
          .filter((v) => Number.isInteger(v) && v > 0 && v <= MAX_REGISTRATION_ID),
      ),
    ];
    if (ids.length === 0) {
      return { success: false, error: "No registrations selected." };
    }
  }

  try {
    const db = await getDb();
    const result = await retryPendingRegistrations(db, {
      ids,
      source: "command-center/registrations",
      actor: staff.wallet,
    });

    if (!result.ok) {
      if (result.error === RETRY_ALREADY_RUNNING) {
        return {
          success: false,
          error: "A retry run is already in progress (cron or another admin). Refresh in a moment.",
        };
      }
      return { success: false, error: result.error };
    }

    return {
      success: true,
      retried: result.retried,
      results: result.results,
      budgetExhausted: result.budgetExhausted,
    };
  } catch (err) {
    reportError(err, {
      source: "command-center/registrations",
      metadata: { step: "retry_action", actor: staff.wallet, ids },
    });
    return { success: false, error: "Retry failed unexpectedly. Check logs." };
  }
}
