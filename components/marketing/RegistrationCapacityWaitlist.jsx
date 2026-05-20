"use client";

import { HubspotWaitlistBanner } from "@/components/registration/HubspotWaitlistBanner";
import { cn } from "@/lib/utils";

export function RegistrationCapacityWaitlist({ paidAtCapacity, className }) {
  if (!paidAtCapacity) return null;
  return (
    <div className={cn("mt-8 w-full", className)}>
      <HubspotWaitlistBanner />
    </div>
  );
}
