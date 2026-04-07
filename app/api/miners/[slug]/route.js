import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { getMinerBySlug, getTiersForMiner } from "@/lib/miners";
import { TIERS as TIER_META } from "@/lib/constants";
import { isDevTestWallet, DEV_TEST_PRICE } from "@/lib/dev-test";

function enrichTier(dbTier, index) {
  const meta = TIER_META.find((t) => t.accountSize === dbTier.accountSize);
  return {
    id: meta?.id || `tier-${index}`,
    name: meta?.name || `$${dbTier.accountSize / 1000}K`,
    accountSize: dbTier.accountSize,
    fullPrice: meta?.fullPrice ?? null,
    promoPrice: Number(dbTier.priceUsdc),
    badge: meta?.badge ?? null,
    details: meta?.details ?? [],
  };
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");
    const devMode = isDevTestWallet(wallet);

    const miner = await getMinerBySlug(slug);
    if (!miner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const dbTiers = await getTiersForMiner(miner.hotkey);
    const activeTiers = dbTiers.filter((t) => t.isActive);

    return NextResponse.json({
      name: miner.name,
      slug: miner.slug,
      usdcWallet: miner.usdcWallet,
      tiers: activeTiers.map((t, i) => {
        const enriched = enrichTier(t, i);
        if (devMode) enriched.promoPrice = DEV_TEST_PRICE;
        return enriched;
      }),
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { route: "api/miners/[slug]" },
    });
    console.error("[api/miners/[slug]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
