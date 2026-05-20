import { ReferralRedirect } from "@/components/analytics/referral-redirect";

export const metadata = {
  title: "Hyperscaled",
  robots: { index: false, follow: false },
};

export default function WallstreetbetsReferralPage() {
  return (
    <ReferralRedirect
      refSource="wallstreetbets"
      pageTitle="WallStreetBets Referral"
      pagePath="/wallstreetbets"
    />
  );
}
