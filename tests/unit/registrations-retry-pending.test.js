import { beforeEach, describe, expect, it, vi } from "vitest";

const errorsMock = vi.hoisted(() => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  reportWarning: vi.fn(),
  flushErrors: vi.fn(async () => {}),
}));

vi.mock("@/lib/errors", () => ({
  ...errorsMock,
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

import { entityMiners, registrations } from "@/lib/db/schema";
import {
  RETRY_ALREADY_RUNNING,
  classifyFetchError,
  retryPendingRegistrations,
} from "@/lib/registrations/retry-pending";
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
const noSleep = async () => {};

/**
 * Minimal drizzle-shaped fake:
 *   select().from(registrations).where(w).orderBy(...)          -> pending rows
 *   select().from(entityMiners).where(w).limit(1)               -> [miner]
 *   select({status}).from(registrations).where(w).limit(1)      -> [{status: reReadStatus}] (lost-CAS re-read)
 *   select({id}).from(registrations).where(w).limit(1)          -> otherRegistered ? [{id}] : []
 *   update(t).set(v).where(w).returning(cols)                   -> [{id}] (or [] when casOwned=false)
 *                                                                  throws updateErrors.shift() when queued
 */
function makeDb({
  pending = [],
  miner = MINER,
  loadError = null,
  casOwned = true,
  updateErrors = [],
  reReadStatus = "registered",
  otherRegistered = false,
} = {}) {
  const updates = [];
  const queuedErrors = [...updateErrors];
  return {
    updates,
    select(cols) {
      return {
        from(table) {
          return {
            where() {
              return {
                orderBy: async () => {
                  if (loadError) throw loadError;
                  return pending;
                },
                limit: async () => {
                  if (table === entityMiners) return miner ? [miner] : [];
                  if (table === registrations && cols && "status" in cols) {
                    return reReadStatus ? [{ status: reReadStatus }] : [];
                  }
                  if (table === registrations && cols && "id" in cols) {
                    return otherRegistered ? [{ id: 1 }] : [];
                  }
                  return [];
                },
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
                  const err = queuedErrors.shift();
                  if (err) throw err;
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
const dupMiner = () =>
  vi.fn(async () =>
    response({
      ok: false,
      status: 400,
      text: JSON.stringify({ status: "error", message: `Hyperliquid address ${HL} is already registered to subaccount 5Dvk3T_test_12` }),
    }),
  );
const collateralMiner = () =>
  vi.fn(async () =>
    response({
      ok: false,
      status: 400,
      text: JSON.stringify({
        status: "error",
        message: "Insufficient collateral: has 0.0 theta, needs 2.0 theta to create new subaccount with $5000.0 account size",
      }),
    }),
  );

const run = (db, opts) => retryPendingRegistrations(db, { lock: openLock, sleepImpl: noSleep, ...opts });

describe("retryPendingRegistrations", () => {
  beforeEach(() => {
    delete process.env.ENTITY_MINER_API_KEY;
    errorsMock.reportError.mockClear();
    errorsMock.reportCritical.mockClear();
    errorsMock.reportWarning.mockClear();
    errorsMock.flushErrors.mockClear();
  });

  it("marks the row registered when the miner accepts, keeping register-time detail keys", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const fetchImpl = okMiner();

    const result = await run(db, { fetchImpl, reqId: "t1" });

    expect(result).toEqual({
      ok: true,
      retried: 1,
      budgetExhausted: false,
      results: [{ id: 980, hlAddress: HL, status: "registered" }],
    });
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0]).toMatchObject({
      status: "registered",
      statusDetail: { paymentMethod: "eip712" },
      metadata: { status: "success", subaccount_id: 42 },
    });
    expect(db.updates[0].statusDetail.reason).toBeUndefined();
    expect(db.updates[0].updatedAt).toBeInstanceOf(Date);
    expect(errorsMock.flushErrors).toHaveBeenCalled();

    // Miner call shape: trailing slash stripped, bearer from DB key, HL payload, bounded by a timeout.
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://miner.example/api/create-hl-subaccount");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer db-key");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body)).toEqual({ hl_address: HL, account_size: 5000, payout_address: HL });
  });

  it("nulls statusDetail on success when there is nothing to carry over", async () => {
    const db = makeDb({ pending: [pendingRow({ statusDetail: { reason: "miner_api_error", apiStatus: 400, error: "x" } })] });
    await run(db, { fetchImpl: okMiner() });
    expect(db.updates[0].statusDetail).toBeNull();
  });

  it("refuses to run while another run holds the lock", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const fetchImpl = okMiner();

    const result = await run(db, { fetchImpl, lock: busyLock });

    expect(result).toEqual({ ok: false, error: RETRY_ALREADY_RUNNING });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(db.updates).toHaveLength(0);
  });

  it("uses the db transaction + advisory lock by default and heartbeats through it", async () => {
    vi.useFakeTimers();
    try {
      const executed = [];
      const db = makeDb({ pending: [] });
      db.transaction = async (fn) =>
        fn({
          execute: async (q) => {
            executed.push(String(q.queryChunks?.[0]?.value ?? q));
            return { rows: [{ locked: true }] };
          },
        });

      const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn(), sleepImpl: noSleep });

      expect(result).toEqual({ ok: true, retried: 0, results: [], budgetExhausted: false });
      expect(executed).toHaveLength(1); // the lock query; heartbeat interval was cleared before it fired
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports busy when the advisory lock is not acquired", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    db.transaction = async (fn) => fn({ execute: async () => ({ rows: [{ locked: false }] }) });

    const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn(), sleepImpl: noSleep });

    expect(result).toEqual({ ok: false, error: RETRY_ALREADY_RUNNING });
  });

  it("keeps a finished run's results if the lock transaction dies after the loop", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    db.transaction = async (fn) => {
      await fn({ execute: async () => ({ rows: [{ locked: true }] }) });
      throw new Error("Connection terminated unexpectedly");
    };

    const result = await retryPendingRegistrations(db, { fetchImpl: okMiner(), sleepImpl: noSleep });

    expect(result.ok).toBe(true);
    expect(result.results).toEqual([{ id: 980, hlAddress: HL, status: "registered" }]);
    expect(errorsMock.reportWarning).toHaveBeenCalledWith("retry_lock_lost_after_run", expect.anything());
    expect(errorsMock.reportCritical).not.toHaveBeenCalled();
  });

  it("keeps the row pending, merges status_detail and keeps paymentMethod on a miner error (collateral case)", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    const fetchImpl = collateralMiner();

    const result = await run(db, { fetchImpl });

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

  it("aggregates miner errors into one alert per (reason, status, miner) per run", async () => {
    const rows = [pendingRow({ id: 1 }), pendingRow({ id: 2 }), pendingRow({ id: 3, minerHotkey: "other" })];
    const db = makeDb({ pending: rows });

    await run(db, { fetchImpl: collateralMiner() });

    const alerts = errorsMock.reportError.mock.calls.filter(([e]) => e?.message === "retry_miner_api_error");
    expect(alerts).toHaveLength(2); // one per miner hotkey, not one per row
    const byMiner = Object.fromEntries(alerts.map(([, ctx]) => [ctx.metadata.minerHotkey, ctx.metadata]));
    expect(byMiner[MINER.hotkey]).toMatchObject({ rows: 2, regIds: [1, 2], apiStatus: 400 });
    expect(byMiner.other).toMatchObject({ rows: 1, regIds: [3] });
  });

  it("marks the row failed on the duplicate guard, noting when no other registered row exists", async () => {
    const db = makeDb({ pending: [pendingRow()], otherRegistered: false });

    const result = await run(db, { fetchImpl: dupMiner() });

    expect(result.results[0]).toMatchObject({ id: 980, status: "failed", reason: "already_registered_at_miner" });
    expect(result.results[0].note).toMatch(/No other registered row/);
    expect(db.updates[0]).toMatchObject({ status: "failed" });
    expect(db.updates[0].statusDetail).toMatchObject({
      paymentMethod: "eip712",
      reason: "already_registered_at_miner",
      apiStatus: 400,
    });
    expect(db.updates[0].statusDetail.note).toMatch(/Verify at the miner before refunding/);
    // This one stays a per-row alert.
    expect(errorsMock.reportError.mock.calls.some(([e]) => e?.message === "retry_already_registered_at_miner")).toBe(true);
  });

  it("flags a likely duplicate payment when another registered row exists", async () => {
    const db = makeDb({ pending: [pendingRow()], otherRegistered: true });
    const result = await run(db, { fetchImpl: dupMiner() });
    expect(result.results[0].note).toMatch(/duplicate payment/);
  });

  it("does not demote a row another writer changed (CAS loses) and reports its real status", async () => {
    const db = makeDb({ pending: [pendingRow()], casOwned: false, reReadStatus: "registered" });

    const result = await run(db, { fetchImpl: dupMiner() });

    expect(result.results).toEqual([
      { id: 980, hlAddress: HL, status: "skipped", reason: "row_changed", currentStatus: "registered" },
    ]);
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0].status).toBe("failed"); // attempted, matched nothing
  });

  it("reports a vanished row when the lost-CAS re-read finds nothing", async () => {
    const db = makeDb({ pending: [pendingRow()], casOwned: false, reReadStatus: null });
    const result = await run(db, { fetchImpl: okMiner() });
    expect(result.results[0]).toMatchObject({ status: "skipped", reason: "row_missing" });
  });

  it("unreachable miner: row stays pending with a code, later rows for that miner are skipped, and a lost CAS is reported honestly", async () => {
    const rows = [pendingRow({ id: 1 }), pendingRow({ id: 2 }), pendingRow({ id: 3, minerHotkey: "other" })];
    const db = makeDb({ pending: rows });
    const fetchImpl = vi.fn(async () => {
      throw Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:1"), { code: "ECONNREFUSED" });
    });

    const result = await run(db, { fetchImpl });

    expect(result.results[0]).toEqual({ id: 1, hlAddress: HL, status: "still_pending", reason: "miner_api_unreachable", error: "ECONNREFUSED" });
    expect(result.results[1]).toMatchObject({ id: 2, status: "skipped", reason: "miner_unreachable_this_run" });
    expect(result.results[2]).toMatchObject({ id: 3, status: "still_pending", reason: "miner_api_unreachable" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(db.updates[0].statusDetail).toMatchObject({
      paymentMethod: "eip712",
      reason: "miner_api_unreachable",
      error: { code: "ECONNREFUSED", message: "connect ECONNREFUSED 127.0.0.1:1" },
    });
    expect(db.updates[0].statusDetail.apiStatus).toBeUndefined();

    const lost = makeDb({ pending: [pendingRow()], casOwned: false, reReadStatus: "failed" });
    const lostResult = await run(lost, { fetchImpl });
    expect(lostResult.results[0]).toMatchObject({ status: "skipped", reason: "row_changed", currentStatus: "failed" });
  });

  it("classifies fetch failures to stable codes", () => {
    expect(classifyFetchError(Object.assign(new Error("x"), { name: "TimeoutError" }))).toBe("timeout");
    expect(classifyFetchError(Object.assign(new Error("x"), { name: "AbortError" }))).toBe("timeout");
    expect(classifyFetchError(Object.assign(new Error("x"), { code: "ECONNRESET" }))).toBe("ECONNRESET");
    expect(classifyFetchError(Object.assign(new Error("fetch failed"), { cause: { code: "ENOTFOUND" } }))).toBe("ENOTFOUND");
    expect(classifyFetchError(new Error("weird"))).toBe("network_error");
  });

  it("skips rows whose miner has no API URL without calling anything", async () => {
    const db = makeDb({ pending: [pendingRow()], miner: { ...MINER, apiUrl: "" } });
    const fetchImpl = vi.fn();

    const result = await run(db, { fetchImpl });

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

    const result = await run(db, { fetchImpl, now, budgetMs: 50 });

    expect(result.retried).toBe(2);
    expect(result.results.map((r) => r.id)).toEqual([1, 2]);
    expect(result.budgetExhausted).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("retries the registered write with backoff and succeeds on a later attempt", async () => {
    const db = makeDb({ pending: [pendingRow()], updateErrors: [new Error("blip 1"), new Error("blip 2")] });
    const sleeps = [];
    const sleepImpl = async (ms) => {
      sleeps.push(ms);
    };

    const result = await run(db, { fetchImpl: okMiner(), sleepImpl });

    expect(result.results[0]).toMatchObject({ id: 980, status: "registered" });
    expect(sleeps).toEqual([250, 1000]);
    expect(db.updates).toHaveLength(1);
  });

  it("reports a miner-accepted-but-unrecorded row with a stable code after the last attempt fails", async () => {
    const db = makeDb({
      pending: [pendingRow({ id: 1 }), pendingRow({ id: 2 })],
      updateErrors: [new Error("down 1"), new Error("down 2"), new Error("down 3")],
    });
    const fetchImpl = okMiner();

    const result = await run(db, { fetchImpl });

    expect(result.ok).toBe(true);
    expect(result.results[0]).toEqual({ id: 1, hlAddress: HL, status: "db_error", error: "db_write_failed", minerAccepted: true });
    // Row 2's write succeeds (errors were consumed by row 1's three attempts).
    expect(result.results[1]).toMatchObject({ id: 2, status: "registered" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    // Raw driver message never reaches the result payload.
    expect(JSON.stringify(result)).not.toMatch(/down 1/);
  });

  it("isolates a failing non-success write to its row and keeps going", async () => {
    const db = makeDb({ pending: [pendingRow({ id: 1 }), pendingRow({ id: 2 })], updateErrors: [new Error("db write failed")] });

    const result = await run(db, { fetchImpl: collateralMiner() });

    expect(result.results[0]).toEqual({ id: 1, hlAddress: HL, status: "db_error", error: "db_write_failed" });
    expect(result.results[1]).toMatchObject({ id: 2, status: "still_pending" });
  });

  it("returns ok:false when pending rows cannot be loaded", async () => {
    const db = makeDb({ loadError: new Error("db down") });

    const result = await run(db, { fetchImpl: vi.fn() });

    expect(result).toEqual({ ok: false, error: "Failed to load pending registrations" });
    expect(errorsMock.flushErrors).toHaveBeenCalled();
  });

  it("returns ok:false when the lock itself cannot be taken (db error)", async () => {
    const db = makeDb({ pending: [pendingRow()] });
    db.transaction = async () => {
      throw new Error("connection lost");
    };

    const result = await retryPendingRegistrations(db, { fetchImpl: vi.fn(), sleepImpl: noSleep });

    expect(result).toEqual({ ok: false, error: "Failed to start the retry run" });
    expect(errorsMock.reportCritical).toHaveBeenCalled();
  });

  it("returns an empty run when nothing is pending", async () => {
    const db = makeDb({ pending: [] });
    const fetchImpl = vi.fn();

    const result = await run(db, { fetchImpl });

    expect(result).toEqual({ ok: true, retried: 0, results: [], budgetExhausted: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("falls back to the env API key when the miner row has none", async () => {
    process.env.ENTITY_MINER_API_KEY = "env-key";
    const db = makeDb({ pending: [pendingRow()], miner: { ...MINER, apiKey: null } });
    const fetchImpl = okMiner();

    await run(db, { fetchImpl });

    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe("Bearer env-key");
  });
});

describe("retry result text", () => {
  it("normalises miner error bodies to text", () => {
    expect(errorText("plain")).toBe("plain");
    expect(errorText({ message: "Insufficient collateral" })).toBe("Insufficient collateral");
    expect(errorText({ error: "nope" })).toBe("nope");
    expect(errorText({ code: "ECONNREFUSED" })).toBe("ECONNREFUSED");
    expect(errorText({ status: "error" })).toBe('{"status":"error"}');
    expect(errorText({ message: { nested: true } })).toBe('{"message":{"nested":true}}');
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
    expect(describeRetryResult({ status: "still_pending", reason: "miner_api_unreachable", error: "timeout" })).toBe(
      "Still pending: miner unreachable (timeout)",
    );
    expect(describeRetryResult({ status: "skipped", reason: "no_miner_api" })).toMatch(/no API URL/);
    expect(describeRetryResult({ status: "skipped", reason: "row_changed", currentStatus: "failed" })).toMatch(/changed to "failed"/);
    expect(describeRetryResult({ status: "skipped", reason: "row_missing" })).toMatch(/no longer exists/);
    expect(describeRetryResult({ status: "db_error", error: "db_write_failed" })).toMatch(/database write failed/);
    expect(describeRetryResult({ status: "db_error", error: "db_write_failed", minerAccepted: true })).toMatch(/Miner accepted/);
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
