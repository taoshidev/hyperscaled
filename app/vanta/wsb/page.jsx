import { ReferralRedirect } from "@/components/analytics/referral-redirect";

// KOL/partner referral landing page for r/WallStreetBets traffic via Vanta.
// Accessible at hs.vantatrading.io/wsb — middleware rewrites to /vanta/wsb.
// Fires GA4 events with brand:"vanta" + ref_source:"wsb", then redirects home.
export const metadata = {
  title: "Vanta Trading",
  robots: { index: false, follow: false },
};

export default function VantaWsbReferralPage() {
  return (
    <ReferralRedirect
      refSource="wsb"
      pageTitle="Vanta WSB Referral"
      pagePath="/vanta/wsb"
      delayMs={500}
    />
  );
}
