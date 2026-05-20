import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Activate the testnet route + provide a stable shared secret. Both must be
// set BEFORE the route module is imported because they're read at request time
// not import time, but we set them upfront for clarity.
const SECRET = "test-secret";
process.env.ENABLE_TESTNET_REGISTER = "true";
process.env.TESTNET_REGISTER_SECRET = SECRET;
process.env.STUB_GATEWAY = "false";

const getMinerBySlugMock = vi.fn();
const getTiersForMinerMock = vi.fn();
const getDbMock = vi.fn();
const checkValidatorStatusMock = vi.fn();

vi.mock("@/lib/miners", () => ({
  getMinerBySlug: (...args) => getMinerBySlugMock(...args),
  getTiersForMiner: (...args) => getTiersForMinerMock(...args),
}));

vi.mock("@/lib/db", () => ({
  getDb: (...args) => getDbMock(...args),
}));

vi.mock("@/lib/validator", async () => {
  const actual = await vi.importActual("@/lib/validator");
  return {
    ...actual,
    checkValidatorStatus: (...args) => checkValidatorStatusMock(...args),
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

const { POST } = await import("@/app/api/testnet-register/route.js");
// Import the same drizzle table refs the route uses so the in-memory db can
// distinguish select(users) vs select(registrations) by identity.
const { users: usersTable, registrations: registrationsTable } = await import(
  "@/lib/db/schema.js"
);

const HL_ADDRESS = "0x14b2eb14FE037f14456cF63Ab06a9D46577e2dC1";
const MINER_HOTKEY = "5GCUMqFigwvKh62LdJXYYr3pHhCvpAhWbF83DqB2ZUDZRKwM";

const VALID_BODY = {
  hlAddress: HL_ADDRESS,
  email: "user@example.com",
  accountSize: 1000,
  tierIndex: 0,
};

const ACTIVE_TIER = { isActive: true, accountSize: 1000, priceUsdc: "0.00" };

function makeRequest({ body = VALID_BODY, secret = SECRET, parseError = false } = {}) {
  return {
    headers: {
      get(name) {
        if (name === "x-testnet-secret") return secret;
        if (name === "authorization") return null;
        return null;
      },
    },
    json: async () => {
      if (parseError) throw new Error("bad json");
      return body;
    },
  };
}

// In-memory db chain that mimics Drizzle's fluent select/insert/update API.
// Tables are matched by reference identity against the imported schema refs.
function makeDbChain({
  existingRegistration = null,
  existingUser = null,
} = {}) {
  const inserts = { registrations: [], users: [] };
  const updates = [];

  function tableName(t) {
    if (t === usersTable) return "users";
    if (t === registrationsTable) return "registrations";
    return "unknown";
  }

  return {
    inserts,
    updates,
    select() {
      let table;
      const chain = {
        from(t) { table = tableName(t); return chain; },
        where() { return chain; },
        async limit() {
          if (table === "users") return existingUser ? [existingUser] : [];
          if (table === "registrations") {
            return existingRegistration ? [existingRegistration] : [];
          }
          return [];
        },
      };
      return chain;
    },
    insert(t) {
      const name = tableName(t);
      return {
        values(row) {
          inserts[name].push(row);
          return {
            returning() { return Promise.resolve([{ id: 42 }]); },
            then(onFulfilled) {
              return Promise.resolve().then(onFulfilled);
            },
          };
        },
      };
    },
    update() {
      return {
        set(payload) {
          return {
            where() { updates.push(payload); return Promise.resolve(); },
          };
        },
      };
    },
  };
}

beforeEach(() => {
  getMinerBySlugMock.mockReset();
  getTiersForMinerMock.mockReset();
  getDbMock.mockReset();
  checkValidatorStatusMock.mockReset();

  getMinerBySlugMock.mockResolvedValue({
    hotkey: MINER_HOTKEY,
    slug: "vanta",
    apiUrl: "http://miner.test",
    apiKey: "miner-api-key",
  });
  getTiersForMinerMock.mockResolvedValue([ACTIVE_TIER]);
  checkValidatorStatusMock.mockResolvedValue({ status: "not_found" });
  vi.spyOn(global, "fetch");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/testnet-register — auth & validation", () => {
  it("returns 404 when ENABLE_TESTNET_REGISTER is not 'true'", async () => {
    const old = process.env.ENABLE_TESTNET_REGISTER;
    process.env.ENABLE_TESTNET_REGISTER = "false";
    try {
      const res = await POST(makeRequest());
      expect(res.status).toBe(404);
    } finally {
      process.env.ENABLE_TESTNET_REGISTER = old;
    }
  });

  it("returns 401 when the shared secret doesn't match", async () => {
    const res = await POST(makeRequest({ secret: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid JSON body", async () => {
    const res = await POST(makeRequest({ parseError: true }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await POST(makeRequest({ body: { hlAddress: HL_ADDRESS } }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/testnet-register — miner duplicate guard", () => {
  it("returns 409 with the user-facing message when miner says 'already registered to subaccount'", async () => {
    getDbMock.mockResolvedValue(makeDbChain());
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "already registered to subaccount xyz",
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/already registered with this miner/i);
  });

  it("does NOT insert a registration row when the miner duplicate guard fires", async () => {
    const db = makeDbChain();
    getDbMock.mockResolvedValue(db);
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "already registered to subaccount xyz",
    });
    await POST(makeRequest());
    expect(db.inserts.registrations).toHaveLength(0);
    expect(db.inserts.users).toHaveLength(0);
  });
});

describe("POST /api/testnet-register — free-flow miner failure", () => {
  it("returns 502 with parsed error detail when miner returns 5xx", async () => {
    getDbMock.mockResolvedValue(makeDbChain());
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 504,
      text: async () =>
        '{"status":"error","message":"Request to validator timed out"}',
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("Registration failed");
    // parseErrorBody should turn the JSON-string body into an object
    expect(body.detail).toMatchObject({
      reason: "miner_api_error",
      apiStatus: 504,
      error: { status: "error", message: "Request to validator timed out" },
    });
  });

  it("returns 502 when miner is unreachable (fetch throws)", async () => {
    getDbMock.mockResolvedValue(makeDbChain());
    global.fetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.detail).toMatchObject({
      reason: "miner_api_unreachable",
      error: "ECONNREFUSED",
    });
  });

  it("does NOT insert a registration row on miner failure (no payment to preserve)", async () => {
    const db = makeDbChain();
    getDbMock.mockResolvedValue(db);
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 504,
      text: async () => "timeout",
    });
    await POST(makeRequest());
    expect(db.inserts.registrations).toHaveLength(0);
  });
});

describe("POST /api/testnet-register — happy path", () => {
  it("captures miner JSON response into metadata and inserts a registered row", async () => {
    const db = makeDbChain();
    getDbMock.mockResolvedValue(db);
    const minerPayload = {
      subaccount: { subaccount_uuid: "u-123", synthetic_hotkey: "5XYZ…" },
    };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => minerPayload,
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(db.inserts.registrations).toHaveLength(1);
    const row = db.inserts.registrations[0];
    expect(row.status).toBe("registered");
    expect(row.metadata).toEqual(minerPayload);
    expect(row.statusDetail).toEqual({ paymentMethod: "testnet" });
  });

  it("upserts the user keyed by hl_address (not payout_address)", async () => {
    const db = makeDbChain();
    getDbMock.mockResolvedValue(db);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    await POST(makeRequest());
    expect(db.inserts.users).toHaveLength(1);
    expect(db.inserts.users[0].wallet).toBe(HL_ADDRESS);
  });
});
