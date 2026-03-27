import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrations, entityMiners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
  const retrySecret = process.env.RETRY_SECRET;
  if (!retrySecret) {
    return NextResponse.json({ error: "Retry endpoint not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!timingSafeEqual(retrySecret, auth?.replace(/^Bearer\s+/i, "") || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await db
    .select()
    .from(registrations)
    .where(eq(registrations.status, "pending"));

  if (pending.length === 0) {
    return NextResponse.json({ retried: 0, results: [] });
  }

  // Batch-load all miners we need
  const hotkeySet = [...new Set(pending.map((r) => r.minerHotkey))];
  const miners = {};
  for (const hotkey of hotkeySet) {
    const [miner] = await db
      .select()
      .from(entityMiners)
      .where(eq(entityMiners.hotkey, hotkey))
      .limit(1);
    if (miner) miners[hotkey] = miner;
  }

  const results = [];

  for (const reg of pending) {
    const miner = miners[reg.minerHotkey];
    if (!miner || !miner.apiUrl) {
      results.push({ id: reg.id, status: "skipped", reason: "no_miner_api" });
      continue;
    }

    try {
      const apiKey = resolveMinerApiKey(miner);
      const baseUrl = miner.apiUrl.replace(/\/+$/, "");
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
        results.push({ id: reg.id, status: "registered" });
      } else {
        const errText = await res.text().catch(() => "");
        const detail = { reason: "miner_api_error", error: errText, apiStatus: res.status };
        await db
          .update(registrations)
          .set({ statusDetail: detail, updatedAt: new Date() })
          .where(eq(registrations.id, reg.id));
        results.push({ id: reg.id, status: "still_pending", apiStatus: res.status });
      }
    } catch (err) {
      const detail = { reason: "miner_api_unreachable", error: err.message };
      await db
        .update(registrations)
        .set({ statusDetail: detail, updatedAt: new Date() })
        .where(eq(registrations.id, reg.id));
      results.push({ id: reg.id, status: "still_pending", error: err.message });
    }
  }

  console.log(`[register/retry] Processed ${pending.length} pending registrations:`, JSON.stringify(results));

  return NextResponse.json({ retried: pending.length, results });
}
