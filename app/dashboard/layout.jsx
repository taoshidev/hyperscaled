import { Providers } from "../providers";
import Nav from "@/components/marketing/Nav";

export default function DashboardLayout({ children }) {
  return (
    <Providers>
      <div className="bg-[#09090b] text-white font-sans min-h-[calc(100dvh_-_var(--site-banner-h,0px))]">
        <Nav />
        <main className="pt-16">{children}</main>
      </div>
    </Providers>
  );
}
