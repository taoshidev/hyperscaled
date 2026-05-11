import { ReferralRedirect } from "@/components/analytics/referral-redirect";

// KOL/partner referral landing page for Strato traffic via Vanta.
// Accessible at hs.vantatrading.io/strato — middleware rewrites to /vanta/strato.
// Fires GA4 events with brand:"vanta" + ref_source:"strato", then redirects home.
export const metadata = {
  title: "Vanta Trading",
  robots: { index: false, follow: false },
};

export default function VantaStratoReferralPage() {
  return (
    <ReferralRedirect
      refSource="strato"
      pageTitle="Vanta Strato Referral"
      pagePath="/vanta/strato"
      delayMs={800}
    />
  );
}
