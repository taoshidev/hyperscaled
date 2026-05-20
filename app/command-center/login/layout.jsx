import { Providers } from "@/app/providers";

export const metadata = {
  title: "Command Center · Sign in",
  robots: { index: false, follow: false },
};

export default function CommandCenterLoginLayout({ children }) {
  return <Providers>{children}</Providers>;
}
