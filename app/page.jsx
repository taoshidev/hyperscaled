import { cookies } from "next/headers";
import { getAllActiveMinersWithTiers } from "@/lib/miners";
import App from "@/components/marketing";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const entry = cookieStore.get("hs_entry")?.value;
  const lockedMiner = entry && entry !== "home" ? entry : null;
  const firms = await getAllActiveMinersWithTiers();
  return <App lockedMiner={lockedMiner} firms={firms} />;
}
