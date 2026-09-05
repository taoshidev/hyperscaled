import crypto from "crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { reportCritical, reportWarning } from "@/lib/errors";
import { RETRY_ALREADY_RUNNING, retryPendingRegistrations } from "@/lib/registrations/retry-pending";

// A mutating job: never cache the GET, and give it the same budget the retry
// loop stops itself at (RETRY_BUDGET_MS, 55s by default).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

/**
 * The route accepts either bearer:
 *   - RETRY_SECRET — manual / CLI invocations
 *   - CRON_SECRET  — Vercel injects it on every cron invocation (see vercel.json)
 * Both are compared in constant time; an empty/unset secret never matches.
 */
function isAuthorized(authHeader) {
  const presented = authHeader?.replace(/^Bearer\s+/i, "") || "";
  const secrets = [process.env.RETRY_SECRET, process.env.CRON_SECRET].filter(Boolean);
  // Always run the comparison for every configured secret so the response
  // time does not reveal which one matched.
  let ok = false;
  for (const secret of secrets) {
    if (timingSafeEqual(secret, presented)) ok = true;
  }
  return ok;
}

/**
 * POST|GET /api/register/retry
 *
 * Retries all `pending` registrations by calling the miner API again.
 * GET exists because Vercel cron jobs issue GET requests; POST is kept for
 * scripts and the README-documented manual invocation. The shared
 * implementation lives in `lib/registrations/retry-pending.js` and is also
 * used by the Command Center Registrations page.
 */
async function handle(request, trigger) {
  const reqId = Math.random().toString(36).slice(2, 10);
  console.info(`[REGISTRATION][retry] ${request.method} /api/register/retry received`, { reqId, trigger });

  if (!process.env.RETRY_SECRET && !process.env.CRON_SECRET) {
    console.error("[REGISTRATION][retry] RETRY_SECRET / CRON_SECRET not configured", { reqId });
    reportCritical(new Error("retry_secret_missing"), {
      source: "api/register/retry",
      metadata: { step: "config_missing", reqId },
    });
    return NextResponse.json({ error: "Retry endpoint not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!isAuthorized(auth)) {
    console.warn("[REGISTRATION][retry] unauthorized", { reqId, hasAuth: Boolean(auth) });
    reportWarning("retry_unauthorized", {
      source: "api/register/retry",
      metadata: { step: "unauthorized", reqId, hasAuth: Boolean(auth) },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const result = await retryPendingRegistrations(db, {
    reqId,
    source: "api/register/retry",
    actor: trigger,
  });

  if (!result.ok) {
    if (result.error === RETRY_ALREADY_RUNNING) {
      // Another run (cron or Command Center) holds the lock; that run will
      // cover every pending row, so this is not an error worth alerting on.
      return NextResponse.json({ error: "A retry run is already in progress" }, { status: 409 });
    }
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    retried: result.retried,
    results: result.results,
    budgetExhausted: result.budgetExhausted,
  });
}

export async function POST(request) {
  return handle(request, "bearer");
}

export async function GET(request) {
  return handle(request, "cron");
}
