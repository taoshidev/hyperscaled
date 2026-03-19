import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'

export default function MarketingLayout({ children }) {
  return (
    <div className="bg-[#09090b] text-white font-sans min-h-[100dvh]">
      <Nav />
      <main>
        {children}
      </main>
      <Footer />
    </div>
  )
}
