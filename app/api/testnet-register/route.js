import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners";
import { isValidHLAddress, isValidEmail } from "@/lib/validation";
import { getDb } from "@/lib/db";
import { users, registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";
import { parseErrorBody } from "@/lib/parse-error-body";

const MINER_SLUG = "vanta";

function sanitizeApiKey(key) {
  if (key == null) return null;
  const t = String(key).trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  return t || null;
}

function resolveMinerApiKey(miner) {
  const fromDb = sanitizeApiKey(miner.apiKey);
  if (fromDb) return fromDb;
  const slugEnv = `ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`;
  return sanitizeApiKey(process.env[slugEnv]) || sanitizeApiKey(process.env.ENTITY_MINER_API_KEY) || null;
}

function constantTimeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  try {
    return timingSafeEqual(aBuf, bBuf);
  } catch {
    return false;
  }
}

export async function POST(request) {
  // Hard gate: this route provisions free testnet registrations and must
  // never be reachable in production. Keep it disabled by default — set
  // ENABLE_TESTNET_REGISTER=true plus TESTNET_REGISTER_SECRET on the
  // ops/staging environment that needs it.
  if (process.env.ENABLE_TESTNET_REGISTER !== "true") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const expectedSecret = process.env.TESTNET_REGISTER_SECRET;
  if (!expectedSecret) {
    Sentry.captureMessage(
      "ENABLE_TESTNET_REGISTER=true but TESTNET_REGISTER_SECRET is unset — refusing requests",
      { level: "error" },
    );
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const provided =
    request.headers.get("x-testnet-secret") ||
    (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!constantTimeEqual(provided, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { hlAddress, email, accountSize, tierIndex } = body;

  if (!hlAddress || !email || !accountSize || tierIndex == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidHLAddress(hlAddress)) {
    return NextResponse.json({ error: "Invalid HL address" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  let miner;
  try {
    miner = await getMinerBySlug(MINER_SLUG);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/testnet-register", step: "get_miner" } });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (!miner) {
    return NextResponse.json({ error: "Testnet registration is not available" }, { status: 503 });
  }

  let activeTiers;
  try {
    const minerTiers = await getTiersForMiner(miner.hotkey);
    activeTiers = minerTiers.filter((t) => t.isActive);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/testnet-register", step: "get_tiers" } });
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  if (tierIndex < 0 || tierIndex >= activeTiers.length) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const tier = activeTiers[tierIndex];
  if (tier.accountSize !== accountSize) {
    return NextResponse.json({ error: "Account size mismatch" }, { status: 400 });
  }

  // Reject duplicate registrations
  try {
    const [existing] = await db
      .select({ id: registrations.id, status: registrations.status })
      .from(registrations)
      .where(
        and(
          eq(registrations.minerHotkey, miner.hotkey),
          eq(registrations.hlAddress, hlAddress),
          inArray(registrations.status, ["registered", "pending"]),
        ),
      )
      .limit(1);

    if (existing) {
      // For both "registered" and "pending" on testnet (no payment risk), check the
      // validator before blocking — the user may have been de-registered externally.
      const validatorStatus = await checkValidatorStatus(hlAddress);
      if (isConfirmedDeregistered(validatorStatus.status)) {
        await db
          .update(registrations)
          .set({
            status: "deregistered",
            statusDetail: {
              deregisteredAt: new Date().toISOString(),
              validatorStatus: validatorStatus.status,
            },
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, existing.id));
        console.info("[testnet-register] De-registration detected — DB synced, allowing re-registration", {
          hlAddress,
          validatorStatus: validatorStatus.status,
        });
        // Fall through — allow the registration to proceed
      } else {
        const msg =
          existing.status === "registered"
            ? "This HL address is already registered."
            : "A registration for this address is already being processed.";
        return NextResponse.json({ error: msg }, { status: 409 });
      }
    }
  } catch (err) {
    console.error("[testnet-register] Duplicate check failed:", err.message);
  }

  // Call miner API to provision the HL subaccount
  let registered = false;
  let statusDetail = null;
  let minerResponseBody = null;

  if (miner.apiUrl) {
    try {
      const apiKey = resolveMinerApiKey(miner);
      const baseUrl = miner.apiUrl.replace(/\/+$/, "");
      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(`${baseUrl}/api/create-hl-subaccount`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          hl_address: hlAddress,
          account_size: accountSize,
          payout_address: hlAddress,
        }),
      });

      if (res.ok) {
        registered = true;
        minerResponseBody = await res.json().catch((err) => {
          console.warn("[testnet-register] miner API returned 200 with unparseable JSON body:", err?.message);
          return null;
        });
      } else {
        const errText = await res.text().catch(() => "");
        // Match the primary register route — surface duplicates as 409 instead
        // of silently inserting a second row.
        if (res.status === 400 && errText.includes("already registered to subaccount")) {
          console.warn("[testnet-register] miner reports address already registered — rejecting", { hlAddress });
          return NextResponse.json(
            { error: "This HL address is already registered with this miner." },
            { status: 409 },
          );
        }
        console.error("[testnet-register] Miner API error:", res.status, errText);
        statusDetail = {
          reason: "miner_api_error",
          apiStatus: res.status,
          error: parseErrorBody(errText),
        };
      }
    } catch (err) {
      console.error("[testnet-register] Miner API unreachable:", err.message);
      statusDetail = { reason: "miner_api_unreachable", error: err.message };
    }
  }

  // Testnet is always free → no payment to preserve. Fail loudly instead of
  // inserting a `pending` row that the UI would render as "Provisioning…".
  if (!registered) {
    console.warn("[testnet-register] miner call failed — rejecting", { hlAddress, statusDetail });
    return NextResponse.json(
      {
        error: "Registration failed",
        message:
          "We couldn't provision your account with the miner. Please try again in a moment.",
        detail: statusDetail,
      },
      { status: 502 },
    );
  }

  // Upsert user record
  let userId = null;
  try {
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.wallet, hlAddress))
      .limit(1);

    if (existing) {
      userId = existing.id;
      if (email && email !== existing.email) {
        await db.update(users).set({ email, updatedAt: new Date() }).where(eq(users.id, existing.id));
      }
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ wallet: hlAddress, email })
        .returning({ id: users.id });
      userId = newUser.id;
    }
  } catch (err) {
    console.error("[testnet-register] User upsert failed:", err.message);
  }

  // Insert registration record
  try {
    await db.insert(registrations).values({
      userId,
      minerHotkey: miner.hotkey,
      hlAddress,
      accountSize,
      payoutAddress: hlAddress,
      tierIndex,
      priceUsdc: "0.00",
      txHash: null,
      status: "registered",
      statusDetail: { paymentMethod: "testnet" },
      metadata: minerResponseBody,
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "api/testnet-register", step: "registration_insert" } });
    console.error("[testnet-register] Registration insert failed:", err.message);
    return NextResponse.json(
      { error: "Registration could not be saved. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    status: "registered",
    message: "Your testnet account has been created.",
  });
}
