import "./globals.css";

const SITE_URL = "https://hyperscaled.trade";
const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Hyperscaled — Permissionless Funded Trading on Hyperliquid",
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hyperscaled — Permissionless Funded Trading on Hyperliquid",
    template: "%s",
  },
  description:
    "Trade on Hyperliquid. Get a funded account. Keep 100% of your profits. 1-step challenge. USDC payouts every 7 days. Scale to $2.5M.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Hyperscaled",
    title: "Hyperscaled — Permissionless Funded Trading on Hyperliquid",
    description:
      "The most advanced decentralized prop trading infrastructure. 1-step challenge, 100% profit split, onchain USDC payouts, no KYC to start. Trade your way to $2.5M.",
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hyperscaled",
    creator: "@hyperscaled",
    title: "Hyperscaled — Permissionless Funded Trading on Hyperliquid",
    description:
      "The most advanced decentralized prop trading infrastructure. 1-step challenge, 100% profit split, onchain USDC payouts, no KYC to start.",
    images: ["/og.png"],
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }],
  },
  other: {
    "theme-color": "#0a0a0a",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
