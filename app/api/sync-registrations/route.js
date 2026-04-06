import crypto from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkValidatorStatus, isConfirmedDeregistered } from "@/lib/validator";

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// How many registrations to check concurrently per batch.
const BATCH_SIZE = 10;

// Stop processing before Vercel kills the function.
// Override with SYNC_BUDGET_MS env var (default: 55s for Pro, set ~8s for Hobby).
const BUDGET_MS = parseInt(process.env.SYNC_BUDGET_MS || "55000", 10);

/**
 * GET /api/sync-registrations
 *
 * Cron job: checks every "registered" address against the validator and
 * marks any that have been de-registered externally as "deregistered" in the DB.
 *
 * Protected by CRON_SECRET, which Vercel sets automatically and injects as
 * Authorization: Bearer <secret> on every cron invocation.
 *
 * Schedule is defined in vercel.json.
 */
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (!timingSafeEqual(cronSecret, auth?.replace(/^Bearer\s+/i, "") || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();

  const registered = await db
    .select({ id: registrations.id, hlAddress: registrations.hlAddress })
    .from(registrations)
    .where(eq(registrations.status, "registered"));

  if (registered.length === 0) {
    return NextResponse.json({ checked: 0, deregistered: 0, skipped: 0 });
  }

  let checked = 0;
  let deregistered = 0;
  let skipped = 0;

  for (let i = 0; i < registered.length; i += BATCH_SIZE) {
    if (Date.now() - startTime > BUDGET_MS) {
      skipped = registered.length - i;
      break;
    }

    const batch = registered.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (reg) => {
        const { status } = await checkValidatorStatus(reg.hlAddress);
        if (isConfirmedDeregistered(status)) {
          await db
            .update(registrations)
            .set({
              status: "deregistered",
              statusDetail: {
                deregisteredAt: new Date().toISOString(),
                validatorStatus: status,
                source: "cron/sync-registrations",
              },
              updatedAt: new Date(),
            })
            .where(eq(registrations.id, reg.id));
          return "deregistered";
        }
        return "active";
      }),
    );

    checked += batch.length;
    deregistered += results.filter(
      (r) => r.status === "fulfilled" && r.value === "deregistered",
    ).length;
  }

  const elapsed = Date.now() - startTime;
  console.log(
    `[sync-registrations] checked=${checked} deregistered=${deregistered} skipped=${skipped} elapsed=${elapsed}ms`,
  );

  return NextResponse.json({ checked, deregistered, skipped, elapsed });
}
