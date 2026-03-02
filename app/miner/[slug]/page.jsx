import { notFound } from "next/navigation";
import { getMinerWithTiersBySlug } from "@/lib/miners";
import { RegistrationFlow } from "@/components/registration/registration-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const miner = await getMinerWithTiersBySlug(slug);
  if (!miner) return {};
  return {
    title: `Register — ${miner.name} | Hyperscaled`,
    description: `Sign up to trade with ${miner.name} on the Hyperscaled network`,
  };
}

export default async function MinerPage({ params }) {
  const { slug } = await params;
  const miner = await getMinerWithTiersBySlug(slug);
  if (!miner) notFound();

  const clientMiner = {
    name: miner.name,
    slug: miner.slug,
    color: miner.color,
    tiers: miner.tiers,
  };

  return <RegistrationFlow miner={clientMiner} minerWallet={miner.usdcWallet} />;
}
