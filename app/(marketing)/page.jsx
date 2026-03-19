import { cookies } from "next/headers";
import App from "@/components/marketing";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const entry = cookieStore.get("hs_entry")?.value;
  const lockedMiner = entry && entry !== "home" ? entry : null;
  return <App lockedMiner={lockedMiner} />;
}
