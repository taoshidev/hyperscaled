import { ReferralRedirect } from "@/components/analytics/referral-redirect";

// KOL/partner referral landing page for r/WallStreetBets traffic.
// Pattern: duplicate this directory (e.g. app/twitter/page.jsx) and change
// refSource, pageTitle, and pagePath. Keep robots noindex on every variant.
export const metadata = {
  title: "Hyperscaled",
  robots: { index: false, follow: false },
};

export default function WsbReferralPage() {
  return (
    <ReferralRedirect
      refSource="wsb"
      pageTitle="WSB Referral"
      pagePath="/wsb"
    />
  );
}
