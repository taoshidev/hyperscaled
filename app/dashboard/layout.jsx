import { Providers } from "../providers";
import Nav from "@/components/marketing/Nav";

export default function DashboardLayout({ children }) {
  return (
    <Providers>
      <div className="bg-[#09090b] text-white font-sans min-h-[100dvh]">
        <Nav />
        <main className="pt-16">{children}</main>
      </div>
    </Providers>
  );
}
