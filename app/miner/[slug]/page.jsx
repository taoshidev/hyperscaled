import { notFound } from "next/navigation";
import { getMinerBySlug, getMinerWalletAddress } from "@/lib/miners";
import { RegistrationFlow } from "@/components/registration/registration-flow";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const miner = getMinerBySlug(slug);
  if (!miner) return {};
  return {
    title: `Register — ${miner.name} | Hyperscaled`,
    description: `Sign up to trade with ${miner.name} on the Hyperscaled network`,
  };
}

export default async function MinerPage({ params }) {
  const { slug } = await params;
  const miner = getMinerBySlug(slug);
  if (!miner) notFound();

  const minerWallet = getMinerWalletAddress(miner);

  // Pass only client-safe data (no env keys)
  const clientMiner = {
    name: miner.name,
    slug: miner.slug,
    prices: miner.prices,
    take: miner.take,
    color: miner.color,
  };

  return <RegistrationFlow miner={clientMiner} minerWallet={minerWallet} />;
}
