import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  reportWarning: vi.fn(),
  flushErrors: vi.fn(),
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

import { RETRY_ALREADY_RUNNING, retryPendingRegistrations } from "@/lib/registrations/retry-pending";
import {
  describeRetryResult,
  errorText,
  summarizeRetryResults,
} from "@/lib/registrations/retry-result-text";

const MINER = {
  hotkey: "5Dvk3T_test",
  slug: "hyperfunded",
  apiUrl: "https://miner.example/",
  apiKey: "db-key",
};

const HL = "0xB77DDe3C1372E73E77cC00eaE92631cEcf8799C0";

function pendingRow(overrides = {}) {
  return {
    id: 980,
    minerHotkey: MINER.hotkey,
    hlAddress: HL,
    payoutAddress: HL,
    accountSize: 5000,
    status: "pending",
    statusDetail: { paymentMethod: "eip712", reason: "miner_api_error", apiStatus: 400, error: { message: "old" } },
    createdAt: new Date("2026-09-03T14:03:58Z"),
    updatedAt: new Date("2026-09-03T14:03:58Z"),
    ...overrides,
  };
}

/** Test mutex: always acquired unless `busy`. */
const openLock = async (_db, fn) => ({ acquired: true, value: await fn() });
const busyLock = async () => ({ acquired: false });

/**
 * Minimal drizzle-shaped fake:
 *   select().from(registrations).where(w).orderBy(...)      -> pending rows
 *   select().from(entityMiners).where(w).limit(1)           -> [miner]
 *   update(t).set(v).where(w).returning(cols)               -> [{id}] (or [] when casOwned=false)
 */
function makeDb({ pending = [], miner = MINER, loadError = null, casOwned = true, updateError = null } = {}) {
  const updates = [];
  return {
    updates,
    select() {
      return {
        from() {
          return {
            where() {
              return {
                orderBy: async () => {
                  if (loadError) throw loadError;
                  return pending;
                },
                limit: async () => (miner ? [miner] : []),
              };
            },
          };
        },
      };
    },
    update() {
      return {
        set(values) {
          return {
            where() {
              return {
                returning: async () => {
                  if (updateError) throw updateError;
                  updates.push(values);
                  return casOwned ? [{ id: 1 }] : [];
                },
              };
            },
          };
        },
      };
    },
  };
}

function response({ ok, status, json, text }) {
  return {
    ok,
    status,
    json: async () => {
      if (json instanceof Error) throw json;
      return json;
    },
    text: async () => text ?? "",
  };
}

const okMiner = () => vi.fn(async () => response({ ok: true, status: 200, json: { status: "success", subaccount_id: 42 } }));

describe("retryPendingRegistrations", () => {
  beforeEach(() => {
    delete process.env.ENTITY_MINER_API_KEY;
  });

  it("marks the row registered when the miner accepts (CAS allows pending or failed)", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const fetchImpl = okMiner();

    const result = await retryPendingRegistrations(db, { fetchImpl, reqId: "t1", lock: openLock });

    expect(result).toEqual({
      ok: true,
      retried: 1,
      budgetExhausted: false,
      results: [{ id: 980, hlAddress: HL, status: "registered" }],
    });
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0]).toMatchObject({
      status: "registered",
      statusDetail: null,
      metadata: { status: "success", subaccount_id: 42 },
    });
    expect(db.updates[0].updatedAt).toBeInstanceOf(Date);

    // Miner call shape: trailing slash stripped, bearer from DB key, HL payload, bounded by a timeout.
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://miner.example/api/create-hl-subaccount");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer db-key");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({ hl_address: HL, account_size: 5000, payout_address: HL });
  });

  it("refuses to run while another run holds the lock", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const fetchImpl = okMiner();

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: busyLock });

    expect(result).toEqual({ ok: false, error: RETRY_ALREADY_RUNNING });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(db.updates).toHaveLength(0);
  });

  it("uses the db transaction + advisory lock by default", async () => {
    const executed = [];
    const db = makeDb({ pending: [] });
    db.transaction = async (fn) =>
      fn({
        execute: async (q) => {
          executed.push(q);
          return { rows: [{ locked: true }] };
        },
      });

    const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn() });

    expect(result).toEqual({ ok: true, retried: 0, results: [], budgetExhausted: false });
    expect(executed).toHaveLength(1);
  });

  it("reports busy when the advisory lock is not acquired", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    db.transaction = async (fn) => fn({ execute: async () => ({ rows: [{ locked: false }] }) });

    const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn() });

    expect(result).toEqual({ ok: false, error: RETRY_ALREADY_RUNNING });
  });

  it("keeps the row pending, merges status_detail and keeps paymentMethod on a miner error (collateral case)", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const body = JSON.stringify({
      status: "error",
      message: "Insufficient collateral: has 0.0 theta, needs 2.0 theta to create new subaccount with $5000.0 account size",
    });
    const fetchImpl = vi.fn(async () => response({ ok: false, status: 400, text: body }));

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result.results[0]).toMatchObject({
      id: 980,
      status: "still_pending",
      reason: "miner_api_error",
      apiStatus: 400,
    });
    expect(typeof result.results[0].error).toBe("string");
    expect(result.results[0].error).toMatch(/Insufficient collateral/);
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0].status).toBeUndefined();
    expect(db.updates[0].statusDetail).toMatchObject({
      paymentMethod: "eip712",
      reason: "miner_api_error",
      apiStatus: 400,
    });
  });

  it("marks the row failed when the miner reports the address is already registered", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const fetchImpl = vi.fn(async () =>
      response({
        ok: false,
        status: 400,
        text: JSON.stringify({ status: "error", message: "Hyperliquid address 0xb77d… is already registered to subaccount 5Dvk3T_test_12" }),
      }),
    );

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result.results[0]).toMatchObject({ id: 980, status: "failed", reason: "already_registered_at_miner" });
    expect(db.updates[0]).toMatchObject({ status: "failed" });
    expect(db.updates[0].statusDetail).toMatchObject({
      paymentMethod: "eip712",
      reason: "already_registered_at_miner",
      apiStatus: 400,
    });
  });

  it("does not demote a row another run already registered (CAS loses)", async () => {
    // Row was selected as pending, but by the time the miner answers the
    // duplicate guard, a concurrent run has flipped it to `registered`.
    const db = makeDb({ pending: [pendingRow()], casOwned: false });
    const fetchImpl = vi.fn(async () =>
      response({ ok: false, status: 400, text: "Hyperliquid address is already registered to subaccount X" }),
    );

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result.results).toEqual([{ id: 980, hlAddress: HL, status: "skipped", reason: "handled_elsewhere" }]);
    // The conditional update ran but matched nothing; no unconditional write exists.
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0].status).toBe("failed");
  });

  it("leaves the row pending when the miner is unreachable and skips that miner's later rows this run", async () => {
    const rows = [pendingRow({ id: 1 }), pendingRow({ id: 2 }), pendingRow({ id: 3, minerHotkey: "other" })];
    const db = makeDb({ pending: rows });
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result.results[0]).toMatchObject({ id: 1, status: "still_pending", reason: "miner_api_unreachable", error: "ECONNREFUSED" });
    expect(result.results[1]).toMatchObject({ id: 2, status: "skipped", reason: "miner_unreachable_this_run" });
    // The fake returns the same miner for every hotkey, so row 3's "other" miner is a fresh attempt.
    expect(result.results[2]).toMatchObject({ id: 3, status: "still_pending", reason: "miner_api_unreachable" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(db.updates[0].statusDetail).toMatchObject({ paymentMethod: "eip712", reason: "miner_api_unreachable", error: "ECONNREFUSED" });
    expect(db.updates[0].statusDetail.apiStatus).toBeUndefined();
  });

  it("skips rows whose miner has no API URL without calling anything", async () => {
    const db = makeDb({ pending: [pendingRow()], miner: { ...MINER, apiUrl: "" } });
    const fetchImpl = vi.fn();

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result.results).toEqual([{ id: 980, hlAddress: HL, status: "skipped", reason: "no_miner_api" }]);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(db.updates).toHaveLength(0);
  });

  it("stops at the time budget and reports the rows it did not reach", async () => {
    const rows = [pendingRow({ id: 1 }), pendingRow({ id: 2 }), pendingRow({ id: 3 })];
    const db = makeDb({ pending: rows });
    const fetchImpl = okMiner();
    // Clock: start, first check (0ms), second check (10ms), third check (100ms > budget 50ms)
    const ticks = [0, 0, 10, 100];
    const now = () => ticks.shift() ?? 100;

    const result = await retryPendingRegistrations(db, { fetchImpl, now, budgetMs: 50, lock: openLock });

    expect(result.retried).toBe(2);
    expect(result.results.map((r) => r.id)).toEqual([1, 2]);
    expect(result.budgetExhausted).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("isolates a failing DB write to its row and keeps going", async () => {
    const rows = [pendingRow({ id: 1 }), pendingRow({ id: 2 })];
    const db = makeDb({ pending: rows, updateError: new Error("db write failed") });
    const fetchImpl = okMiner();

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result.ok).toBe(true);
    expect(result.results).toEqual([
      { id: 1, hlAddress: HL, status: "db_error", error: "db write failed" },
      { id: 2, hlAddress: HL, status: "db_error", error: "db write failed" },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns ok:false when pending rows cannot be loaded", async () => {
    const db = makeDb({ loadError: new Error("db down") });

    const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn(), lock: openLock });

    expect(result).toEqual({ ok: false, error: "Failed to load pending registrations" });
  });

  it("returns ok:false when the lock itself cannot be taken (db error)", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    db.transaction = async () => {
      throw new Error("connection lost");
    };

    const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn() });

    expect(result).toEqual({ ok: false, error: "Failed to start the retry run" });
  });

  it("returns an empty run when nothing is pending", async () => {
    const db = makeDb({ pending: [] });
    const fetchImpl = vi.fn();

    const result = await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(result).toEqual({ ok: true, retried: 0, results: [], budgetExhausted: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("falls back to the env API key when the miner row has none", async () => {
    process.env.ENTITY_MINER_API_KEY = "env-key";
    const db = makeDb({ pending: [pendingRow()], miner: { ...MINER, apiKey: null } });
    const fetchImpl = okMiner();

    await retryPendingRegistrations(db, { fetchImpl, lock: openLock });

    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe("Bearer env-key");
  });
});

describe("retry result text", () => {
  it("normalises miner error bodies to text", () => {
    expect(errorText("plain")).toBe("plain");
    expect(errorText({ message: "Insufficient collateral" })).toBe("Insufficient collateral");
    expect(errorText({ error: "nope" })).toBe("nope");
    expect(errorText({ status: "error" })).toBe('{"status":"error"}');
    expect(errorText(null)).toBe("");
  });

  it("renders each outcome for the UI, including object errors", () => {
    expect(describeRetryResult({ status: "registered" })).toBe("Registered");
    expect(describeRetryResult({ status: "failed", error: { message: "dup" } })).toBe(
      "Failed: HL address already registered at the miner (dup)",
    );
    expect(
      describeRetryResult({ status: "still_pending", reason: "miner_api_error", apiStatus: 400, error: { message: "Insufficient collateral" } }),
    ).toBe("Still pending: miner returned 400 — Insufficient collateral");
    expect(describeRetryResult({ status: "still_pending", reason: "miner_api_unreachable", error: "ECONNREFUSED" })).toBe(
      "Still pending: miner unreachable (ECONNREFUSED)",
    );
    expect(describeRetryResult({ status: "skipped", reason: "no_miner_api" })).toMatch(/no API URL/);
    expect(describeRetryResult({ status: "skipped", reason: "handled_elsewhere" })).toMatch(/another retry run/);
    expect(describeRetryResult({ status: "db_error", error: "boom" })).toBe("Not recorded: database write failed (boom)");
  });

  it("summarizes a batch", () => {
    expect(summarizeRetryResults([])).toBe("Nothing to retry");
    expect(
      summarizeRetryResults([
        { status: "registered" },
        { status: "registered" },
        { status: "still_pending" },
        { status: "failed" },
        { status: "db_error" },
      ]),
    ).toBe("2 registered · 1 still pending · 1 failed · 1 not recorded");
  });
});
