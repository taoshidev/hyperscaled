import Nav from '@/components/marketing/Nav'
import Footer from '@/components/marketing/Footer'

export default function VantaStartLayout({ children }) {
  return (
    <div className="bg-[#09090b] text-white font-sans min-h-[100dvh] flex flex-col">
      <Nav excludeLinks={['Partners']} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
