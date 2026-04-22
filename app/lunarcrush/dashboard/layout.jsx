import { Providers } from "@/app/providers"
import Nav from "@/components/marketing/Nav"

export default function LunarCrushDashboardLayout({ children }) {
  return (
    <Providers>
      <div className="bg-background text-white font-sans min-h-[100dvh]">
        <Nav />
        <main className="pt-16">{children}</main>
      </div>
    </Providers>
  )
}
