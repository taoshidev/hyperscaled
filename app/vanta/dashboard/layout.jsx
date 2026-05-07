import { Providers } from "@/app/providers"
import Nav from "@/components/marketing/Nav"

export default function VantaDashboardLayout({ children }) {
  return (
    <Providers>
      <div className="bg-black text-white font-sans min-h-[100dvh]">
        <Nav walletAware />
        {/* pt-24 = parent-site bar (h-8) + nav header (h-16). Hyperscaled
            has no parent bar so its layout uses pt-16. */}
        <main className="pt-24">{children}</main>
      </div>
    </Providers>
  )
}
