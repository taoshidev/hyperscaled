"use client";

import { HubspotProvider } from "next-hubspot";

export function Providers({ children }: { children: React.ReactNode }) {
  return <HubspotProvider>{children}</HubspotProvider>;
}
