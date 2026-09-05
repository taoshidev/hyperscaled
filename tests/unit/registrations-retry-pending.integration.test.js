/**
 * Real-Postgres check of the pieces the unit fakes cannot prove: the
 * advisory-lock transaction serialising two runs, and the compare-and-set
 * status writes. Skipped unless RETRY_INTEGRATION_DATABASE_URL points at a
 * migrated dev database (never production). Creates its own temp
 * entity_miners/registrations rows and deletes them afterwards.
 *
 *   RETRY_INTEGRATION_DATABASE_URL=postgresql://localhost:5432/hyperscaled \
 *     pnpm vitest run --config vitest.config.js tests/unit/registrations-retry-pending.integration.test.js
 */
import http from "node:http";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

const DB_URL = process.env.RETRY_INTEGRATION_DATABASE_URL;

vi.mock("@/lib/errors", () => ({
  reportError: vi.fn(),
  reportCritical: vi.fn(),
  reportWarning: vi.fn(),
  flushErrors: vi.fn(async () => {}),
  SEVERITY: { ERROR: "error", WARNING: "warning", CRITICAL: "critical" },
}));

describe.skipIf(!DB_URL)("retry-pending against a real Postgres", () => {
  const TAG = `smoke-${Date.now()}`;
  const HOTKEY = `5SMOKE${TAG}`;
  const HL = "0x00000000000000000000000000000000000abc01";

  let db;
  let pgClient;
  let server;
  let regId;
  let minerMode = "ok"; // ok | dup | collateral | race-dup
  let hits = 0;
  let mod;
  let schema;

  beforeAll(async () => {
    process.env.DATABASE_URL = DB_URL;
    delete process.env.CLOUD_SQL_INSTANCE_CONNECTION_NAME;
    const pg = (await import("pg")).default;
    pgClient = new pg.Client({ connectionString: DB_URL });
    await pgClient.connect();
    db = await (await import("@/lib/db")).getDb();
    schema = await import("@/lib/db/schema");
    mod = await import("@/lib/registrations/retry-pending");

    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        hits += 1;
        if (minerMode === "race-dup") {
          // A concurrent writer registered the row while this call was in flight.
          await pgClient.query("update registrations set status='registered' where id=$1", [regId]);
        }
        if (minerMode === "ok") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "success", subaccount_id: 4242, echo: JSON.parse(body) }));
        } else if (minerMode === "collateral") {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: "Insufficient collateral: has 0.0 theta, needs 2.0 theta" }));
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ status: "error", message: `Hyperliquid address ${HL} is already registered to subaccount X_1` }));
        }
      });
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));

    await db.insert(schema.entityMiners).values({
      hotkey: HOTKEY,
      name: "Smoke miner",
      slug: `smoke-${TAG}`,
      usdcWallet: "0x0000000000000000000000000000000000000001",
      apiUrl: `http://127.0.0.1:${server.address().port}`,
      apiKey: "smoke-key",
    });
    const [row] = await db
      .insert(schema.registrations)
      .values({
        minerHotkey: HOTKEY,
        hlAddress: HL,
        payerAddress: HL,
        payoutAddress: HL,
        accountSize: 5000,
        tierIndex: 1,
        priceUsdc: "74.00",
        txHash: `0x${TAG}`,
        status: "pending",
        statusDetail: { paymentMethod: "eip712", reason: "miner_api_error", apiStatus: 400, error: { message: "old" } },
      })
      .returning({ id: schema.registrations.id });
    regId = row.id;
  });

  afterAll(async () => {
    if (!db) return;
    await db.delete(schema.registrations).where(eq(schema.registrations.id, regId));
    await db.delete(schema.entityMiners).where(eq(schema.entityMiners.hotkey, HOTKEY));
    await pgClient.end();
    await new Promise((r) => server.close(r));
  });

  async function rowNow() {
    const [r] = await db.select().from(schema.registrations).where(eq(schema.registrations.id, regId));
    return r;
  }

  it("collateral error: stays pending, status_detail merged, updated_at bumped", async () => {
    minerMode = "collateral";
    const before = await rowNow();
    const result = await mod.retryPendingRegistrations(db, { ids: [regId] });
    expect(result.ok).toBe(true);
    expect(result.results[0]).toMatchObject({ id: regId, status: "still_pending", reason: "miner_api_error", apiStatus: 400 });
    const after = await rowNow();
    expect(after.status).toBe("pending");
    expect(after.statusDetail).toMatchObject({ paymentMethod: "eip712", reason: "miner_api_error", apiStatus: 400 });
    expect(after.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
  });

  it("lock: two concurrent runs → one runs, the other reports already running", async () => {
    minerMode = "ok";
    hits = 0;
    const [a, b] = await Promise.all([
      mod.retryPendingRegistrations(db, { ids: [regId] }),
      mod.retryPendingRegistrations(db, { ids: [regId] }),
    ]);
    const outcomes = [a, b].map((r) => (r.ok ? "ran" : r.error));
    expect(outcomes).toContain("ran");
    expect(outcomes).toContain(mod.RETRY_ALREADY_RUNNING);
    expect(hits).toBe(1);
    const after = await rowNow();
    expect(after.status).toBe("registered");
    expect(after.statusDetail).toEqual({ paymentMethod: "eip712" });
    expect(after.metadata).toMatchObject({ subaccount_id: 4242 });
  });

  it("CAS: a duplicate-guard reply cannot demote a row another writer registered meanwhile", async () => {
    await pgClient.query("update registrations set status='pending' where id=$1", [regId]);
    minerMode = "race-dup";
    const result = await mod.retryPendingRegistrations(db, { ids: [regId] });
    expect(result.ok).toBe(true);
    expect(result.results[0]).toMatchObject({ id: regId, status: "skipped", reason: "row_changed", currentStatus: "registered" });
    expect((await rowNow()).status).toBe("registered");
  });

  it("does not pick up failed rows", async () => {
    await pgClient.query("update registrations set status='failed' where id=$1", [regId]);
    minerMode = "ok";
    const result = await mod.retryPendingRegistrations(db, { ids: [regId] });
    expect(result).toEqual({ ok: true, retried: 0, results: [], budgetExhausted: false });
  });
});
