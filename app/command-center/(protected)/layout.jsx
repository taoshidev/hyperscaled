import { AdminShell } from "@/components/admin/AdminShell";
import { requireCommandCenterStaff } from "@/lib/auth/command-center.js";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Command Center · Hyperscaled",
  robots: { index: false, follow: false },
};

export default async function CommandCenterProtectedLayout({ children }) {
  const staff = await requireCommandCenterStaff();
  return (
    <AdminShell wallet={staff.wallet} role={staff.role} label={staff.label}>
      {children}
    </AdminShell>
  );
}
