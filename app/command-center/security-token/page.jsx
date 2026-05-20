import { redirect } from "next/navigation";

import {
  readCommandCenterSession,
  getStaffByWallet,
} from "@/lib/auth/command-center.js";
import { commandCenterSecurityTokenConfigured } from "@/lib/auth/command-center-security.js";
import { CommandCenterSecurityToken } from "@/components/command-center/CommandCenterSecurityToken";

export const dynamic = "force-dynamic";

export default async function CommandCenterSecurityTokenPage() {
  const session = await readCommandCenterSession();
  if (!session) {
    redirect("/command-center/login");
  }

  const staff = await getStaffByWallet(session.wallet);
  if (!staff) {
    redirect("/command-center/login");
  }

  if (!commandCenterSecurityTokenConfigured()) {
    redirect("/command-center/promo-codes");
  }

  if (session.secured === true) {
    redirect("/command-center/promo-codes");
  }

  return <CommandCenterSecurityToken />;
}
