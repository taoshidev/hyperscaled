import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminShell({ wallet, role, label, children }) {
  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden bg-[#09090b] text-white">
      <AdminSidebar wallet={wallet} role={role} label={label} />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
