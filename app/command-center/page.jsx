import { redirect } from "next/navigation";
import {
  readCommandCenterSession,
  getStaffByWallet,
} from "@/lib/auth/command-center.js";
import { commandCenterSecurityTokenConfigured } from "@/lib/auth/command-center-security.js";

export const dynamic = "force-dynamic";

export default async function CommandCenterIndexPage() {
  const session = await readCommandCenterSession();
  if (session) {
    const staff = await getStaffByWallet(session.wallet);
    if (staff) {
      if (
        commandCenterSecurityTokenConfigured() &&
        session.secured !== true
      ) {
        redirect("/command-center/security-token");
      }
      redirect("/command-center/promo-codes");
    }
  }
  redirect("/command-center/login");
}
