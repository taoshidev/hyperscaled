import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { GA_MEASUREMENT_ID } from "@/lib/analytics";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";

const SITE_URL = "https://hyperscaled.trade";
const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Hyperscaled — Scaled Trading on Hyperliquid",
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hyperscaled — Scaled Trading on Hyperliquid",
    template: "%s",
  },
  description:
    "Trade on Hyperliquid. Get a scaled account. Keep 100% of your profits. 1-step challenge. Monthly USDC payouts. Scale to $2.5M.",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Hyperscaled",
    title: "Hyperscaled — Scaled Trading on Hyperliquid",
    description:
      "The most advanced decentralized prop trading infrastructure. 1-step challenge, 100% profit split, onchain USDC payouts, no KYC to start. Trade your way to $2.5M.",
    url: SITE_URL,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hyperscaled",
    creator: "@hyperscaled",
    title: "Hyperscaled — Scaled Trading on Hyperliquid",
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
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
