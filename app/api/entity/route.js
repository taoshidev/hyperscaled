import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { entityMiners, entityTiers } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { getAllActiveMinersWithTiers } from "@/lib/miners";
import { verifyHotkeySignature } from "@/lib/auth";
import { isValidEvmAddress } from "@/lib/validation";

function isValidPublicUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname;
    // Block private/internal IPs and hostnames
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname === "169.254.169.254" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local") ||
      hostname === "[::1]"
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const miners = await getAllActiveMinersWithTiers();
  return NextResponse.json(miners);
}

export async function PATCH(request) {
  const db = await getDb();
  let auth;
  try {
    auth = await verifyHotkeySignature(request);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }

  const { hotkey } = auth;

  // Verify this hotkey corresponds to an existing miner
  const [miner] = await db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.hotkey, hotkey))
    .limit(1);

  if (!miner) {
    return NextResponse.json({ error: "Miner not found for this hotkey" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate fields that need uniqueness or format checks before any DB writes
  if (body.apiUrl !== undefined) {
    if (body.apiUrl && !isValidPublicUrl(body.apiUrl)) {
      return NextResponse.json({ error: "Invalid API URL" }, { status: 400 });
    }
  }

  if (body.slug !== undefined) {
    const [conflict] = await db
      .select({ hotkey: entityMiners.hotkey })
      .from(entityMiners)
      .where(eq(entityMiners.slug, body.slug))
      .limit(1);
    if (conflict && conflict.hotkey !== hotkey) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
  }

  if (body.usdcWallet !== undefined && body.usdcWallet && !isValidEvmAddress(body.usdcWallet)) {
    return NextResponse.json({ error: "Invalid USDC wallet address" }, { status: 400 });
  }

  // Update miner fields
  const minerUpdate = {};
  if (body.name !== undefined) minerUpdate.name = body.name;
  if (body.slug !== undefined) minerUpdate.slug = body.slug;
  if (body.usdcWallet !== undefined) minerUpdate.usdcWallet = body.usdcWallet;
  if (body.apiUrl !== undefined) minerUpdate.apiUrl = body.apiUrl;
  if (body.apiKey !== undefined) minerUpdate.apiKey = body.apiKey;
  if (body.color !== undefined) minerUpdate.color = body.color;
  if (body.payoutCadenceDays !== undefined) minerUpdate.payoutCadenceDays = body.payoutCadenceDays;

  if (Object.keys(minerUpdate).length > 0) {
    minerUpdate.updatedAt = new Date();
    await db.update(entityMiners).set(minerUpdate).where(eq(entityMiners.hotkey, hotkey));
  }

  // Update tiers if provided
  if (Array.isArray(body.tiers)) {
    // Deactivate all existing tiers, then upsert
    await db
      .update(entityTiers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(entityTiers.hotkey, hotkey));

    for (const tier of body.tiers) {
      await db.insert(entityTiers).values({
        hotkey,
        accountSize: tier.accountSize,
        priceUsdc: String(tier.priceUsdc),
        profitSplit: tier.profitSplit,
        isActive: tier.isActive !== false,
      });
    }
  }

  // Pricing pages cache tier data; clear it after miner/tiers update.
  revalidateTag("pricing-tiers");
  if (miner.slug) {
    revalidateTag(`pricing-tiers:${miner.slug}`);
  }

  // Return updated miner with tiers
  const [updated] = await db
    .select()
    .from(entityMiners)
    .where(eq(entityMiners.hotkey, hotkey))
    .limit(1);

  const tiers = await db
    .select()
    .from(entityTiers)
    .where(eq(entityTiers.hotkey, hotkey))
    .orderBy(asc(entityTiers.accountSize));

  return NextResponse.json({
    ...updated,
    tiers: tiers.filter((t) => t.isActive).map((t) => ({
      accountSize: t.accountSize,
      priceUsdc: Number(t.priceUsdc),
      profitSplit: t.profitSplit,
      isActive: t.isActive,
    })),
  });
}
