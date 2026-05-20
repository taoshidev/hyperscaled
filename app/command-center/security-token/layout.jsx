import { Providers } from "@/app/providers";

export const metadata = {
  title: "Command Center · Security verification",
  robots: { index: false, follow: false },
};

export default function CommandCenterSecurityTokenLayout({ children }) {
  return <Providers>{children}</Providers>;
}
