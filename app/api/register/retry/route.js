import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { registrations, entityMiners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { reportError, reportCritical, reportWarning } from "@/lib/errors";

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against itself to burn constant time, then return false
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function sanitizeApiKey(key) {
  if (key == null) return null;
  const t = String(key)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
  return t || null;
}

function resolveMinerApiKey(miner) {
  const fromDb = sanitizeApiKey(miner.apiKey);
  if (fromDb) return fromDb;
  const slugEnv = `ENTITY_MINER_API_KEY_${miner.slug.replace(/-/g, "_").toUpperCase()}`;
  return sanitizeApiKey(process.env[slugEnv]) || sanitizeApiKey(process.env.ENTITY_MINER_API_KEY) || null;
}

async function postCreateHlSubaccount(baseUrl, payload, apiKey) {
  const headers = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  return fetch(`${baseUrl}/api/create-hl-subaccount`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/register/retry
 *
 * Retries all pending registrations by calling the miner API again.
 * Protected by a shared secret (RETRY_SECRET env var) so only cron jobs
 * or admins can trigger it.
 */
export async function POST(request) {
  const db = await getDb();
  const reqId = Math.random().toString(36).slice(2, 10);
  console.info("[REGISTRATION][retry] POST /api/register/retry received", { reqId });

  const retrySecret = process.env.RETRY_SECRET;
  if (!retrySecret) {
    console.error("[REGISTRATION][retry] RETRY_SECRET not configured", { reqId });
    reportCritical(new Error("retry_secret_missing"), {
      source: "api/register/retry",
      metadata: { step: "config_missing", reqId },
    });
    return NextResponse.json({ error: "Retry endpoint not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!timingSafeEqual(retrySecret, auth?.replace(/^Bearer\s+/i, "") || "")) {
    console.warn("[REGISTRATION][retry] unauthorized", { reqId, hasAuth: Boolean(auth) });
    reportWarning("retry_unauthorized", {
      source: "api/register/retry",
      metadata: { step: "unauthorized", reqId, hasAuth: Boolean(auth) },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let pending;
  try {
    pending = await db
      .select()
      .from(registrations)
      .where(eq(registrations.status, "pending"));
  } catch (err) {
    reportCritical(err, {
      source: "api/register/retry",
      metadata: { step: "load_pending_registrations", reqId },
    });
    return NextResponse.json({ error: "Failed to load pending registrations" }, { status: 500 });
  }

  console.info("[REGISTRATION][retry] pending count", { reqId, pendingCount: pending.length });

  if (pending.length === 0) {
    return NextResponse.json({ retried: 0, results: [] });
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
        source: "api/register/retry",
        metadata: { step: "load_miner", reqId, hotkey },
      });
    }
  }

  const results = [];

  for (const reg of pending) {
    const miner = miners[reg.minerHotkey];
    if (!miner || !miner.apiUrl) {
      console.warn("[REGISTRATION][retry] skipping — miner has no apiUrl", {
        reqId,
        regId: reg.id,
        minerHotkey: reg.minerHotkey,
      });
      results.push({ id: reg.id, status: "skipped", reason: "no_miner_api" });
      continue;
    }

    try {
      const apiKey = resolveMinerApiKey(miner);
      const baseUrl = miner.apiUrl.replace(/\/+$/, "");
      console.info("[REGISTRATION][retry] calling miner API", {
        reqId,
        regId: reg.id,
        baseUrl,
        hlAddress: reg.hlAddress,
        hasApiKey: Boolean(apiKey),
      });
      const res = await postCreateHlSubaccount(
        baseUrl,
        {
          hl_address: reg.hlAddress,
          account_size: reg.accountSize,
          payout_address: reg.payoutAddress,
        },
        apiKey,
      );

      if (res.ok) {
        await db
          .update(registrations)
          .set({ status: "registered", statusDetail: null, updatedAt: new Date() })
          .where(eq(registrations.id, reg.id));
        console.info("[REGISTRATION][retry] marked registered", { reqId, regId: reg.id });
        results.push({ id: reg.id, status: "registered" });
      } else {
        const errText = await res.text().catch(() => "");
        const detail = { reason: "miner_api_error", error: errText, apiStatus: res.status };
        await db
          .update(registrations)
          .set({ statusDetail: detail, updatedAt: new Date() })
          .where(eq(registrations.id, reg.id));
        console.warn("[REGISTRATION][retry] still pending — miner API error", {
          reqId,
          regId: reg.id,
          apiStatus: res.status,
          errText: errText.slice(0, 300),
        });
        reportError(new Error("retry_miner_api_error"), {
          source: "api/register/retry",
          metadata: {
            step: "miner_api_error",
            reqId,
            regId: reg.id,
            minerHotkey: reg.minerHotkey,
            hlAddress: reg.hlAddress,
            apiStatus: res.status,
            errText: errText.slice(0, 500),
          },
        });
        results.push({ id: reg.id, status: "still_pending", apiStatus: res.status });
      }
    } catch (err) {
      const detail = { reason: "miner_api_unreachable", error: err.message };
      await db
        .update(registrations)
        .set({ statusDetail: detail, updatedAt: new Date() })
        .where(eq(registrations.id, reg.id));
      console.error("[REGISTRATION][retry] miner API unreachable", {
        reqId,
        regId: reg.id,
        error: err.message,
      });
      reportError(err, {
        source: "api/register/retry",
        metadata: {
          step: "miner_api_unreachable",
          reqId,
          regId: reg.id,
          minerHotkey: reg.minerHotkey,
          hlAddress: reg.hlAddress,
          apiUrl: miner.apiUrl,
        },
      });
      results.push({ id: reg.id, status: "still_pending", error: err.message });
    }
  }

  console.info("[REGISTRATION][retry] processed batch", {
    reqId,
    total: pending.length,
    results,
  });

  return NextResponse.json({ retried: pending.length, results });
}
