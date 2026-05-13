"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useBrand } from "@/lib/brand";

export function HubspotWaitlistBanner() {
  const brand = useBrand();
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || "";
  const formId = process.env.NEXT_PUBLIC_HUBSPOT_WAITLIST_FORM_ID || "";
  const enabled = Boolean(portalId && formId);

  const scriptLoadedRef = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (scriptLoadedRef.current) return;
    scriptLoadedRef.current = true;

    const existing = document.querySelector('script[src*="hsforms.net"]');

    const createForm = () => {
      if (!window.hbspt) return;
      window.hbspt.forms.create({
        cssClass: "hyperscaled-waitlist-form",
        portalId,
        formId,
        region: "na1",
        target: "#hubspot-waitlist-form",
        onFormSubmitted: () => {
          setSubmitted(true);
        },
        onFormReady: ($form) => {
          const root = $form?.[0] || $form;
          if (!root) return;
          const submitBtn = root.querySelector(
            'input[type="submit"], button[type="submit"], .hs-button',
          );
          if (submitBtn) {
            if (submitBtn.tagName === "INPUT") submitBtn.value = "Join Waitlist";
            else submitBtn.textContent = "Join Waitlist";
          }
          const emailInput = root.querySelector('input[type="email"]');
          const setPlaceholder = () => {
            if (emailInput) {
              emailInput.placeholder = "Enter your email address";
              emailInput.setAttribute("placeholder", "Enter your email address");
            }
          };
          setPlaceholder();
          setTimeout(setPlaceholder, 200);
          setTimeout(setPlaceholder, 500);
          root
            .querySelectorAll(".hs-form-required")
            .forEach((el) => {
              el.style.display = "none";
            });
        },
      });
    };

    if (existing) {
      existing.addEventListener("load", createForm);
      if (window.hbspt) createForm();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.hsforms.net/forms/v2.js";
    script.charset = "utf-8";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      setTimeout(createForm, 100);
    };
    document.body.appendChild(script);
  }, [enabled, portalId, formId]);

  const headline = `Demand for ${brand.name} has exceeded expectations.`;
  const body =
    "To protect performance and reliability, access is being rolled out in stages. Join the waitlist to be part of the next wave and get invited as soon as new spots open.";

  return (
    <div className="self-stretch rounded-2xl border border-white/[0.08] bg-zinc-900/60 px-5 py-6 sm:px-6 sm:py-7 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
      <div className="flex w-full min-w-0 flex-1 items-start gap-4 sm:items-center lg:min-w-0">
        <div className="w-12 h-12 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-medium leading-5 text-amber-400 wrap-break-word">
            {headline}
          </p>
          <p className="text-sm font-normal leading-5 text-zinc-400 wrap-break-word mt-0.5">
            {body}
          </p>
        </div>
      </div>
      <div className="flex w-full shrink-0 flex-row items-center gap-2 lg:w-auto lg:min-w-[260px]">
        {!enabled ? (
          <p className="text-xs text-zinc-500 italic">
            We&apos;ll reopen registrations soon — check back shortly.
          </p>
        ) : submitted ? (
          <p className="text-sm text-teal-400 font-medium">
            You&apos;re on the waitlist. We&apos;ll be in touch when spots open.
          </p>
        ) : (
          <div
            id="hubspot-waitlist-form"
            className="hyperscaled-waitlist-form w-full"
          />
        )}
      </div>
    </div>
  );
}
