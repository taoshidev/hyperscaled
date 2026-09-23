import RegistrationClosed from "@/components/registration/registration-closed";
import { buildMetadata } from "@/lib/metadata";
import { REGISTRATION_CLOSED_COPY } from "@/lib/sunset";

// Notion #1560: this legacy per-miner checkout is closed like /register. Every
// slug gets the closure notice (no miner lookup) so old links still resolve.
export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildMetadata({
    title: REGISTRATION_CLOSED_COPY.heading,
    description: REGISTRATION_CLOSED_COPY.body,
    path: `/miner/${encodeURIComponent(slug)}`,
    robots: { index: false, follow: true },
  });
}

export default function MinerPage() {
  return <RegistrationClosed />;
}
