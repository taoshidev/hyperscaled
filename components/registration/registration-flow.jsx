"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Providers } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Stepper } from "./stepper";
import { StepSelectTier } from "./step-select-tier";
import { StepConnectAndPay } from "./step-connect-pay";
import { StepConfirmation } from "./step-confirmation";
import { RegistrationHelpProvider } from "./registration-help-context";
import { RegistrationSidebar } from "./registration-sidebar";
import { MobileHelpSheet } from "./mobile-help-sheet";
import { useBrandHref } from "@/lib/brand";
import { reportCritical } from "@/lib/errors";
import { trackEvent, getRefSource } from "@/lib/analytics";
import { useRegistrationCapacity } from "@/hooks/use-registration-capacity";
import { tierBlockedForCaps } from "@/lib/registration-tier-helpers";

const STEP_LABELS = ["Select Plan", "Connect & Pay", "Confirm", "Done"];
const DEFAULT_MINER_SLUG = "vanta";

const MOCK_WALLET = "0x0000000000000000000000000000000000000000";

function normalizeAccountSize(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function tiersMatch(a, b) {
  if (!a || !b) return false;
  if (a.id != null && b.id != null && String(a.id) === String(b.id)) return true;
  const aSize = normalizeAccountSize(a.accountSize);
  const bSize = normalizeAccountSize(b.accountSize);
  if (aSize != null && bSize != null && aSize === bSize) return true;
  return false;
}

function findTierIndexInList(list, tier) {
  if (!list?.length || !tier) return 0;
  const i = list.findIndex((t) => tiersMatch(tier, t));
  return i >= 0 ? i : 0;
}

// Resolve a `?tier=<accountSize>` deep-link against a loaded tier list.
// Returns `{ tier, index }` on a hit, `null` otherwise.
function resolveTierParam(rawTierParam, tiers) {
  if (!rawTierParam) return null;
  const requestedSize = Number(rawTierParam);
  if (!Number.isFinite(requestedSize) || requestedSize <= 0) return null;
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const index = tiers.findIndex(
    (t) => normalizeAccountSize(t.accountSize) === requestedSize,
  );
  if (index < 0) return null;
  return { tier: tiers[index], index };
}

function getRecoveredRegistration() {
  try {
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("hs_registration_result")
      : null;
    if (!raw) return null;
    const result = JSON.parse(raw);
    if (!result.success || !result.txHash) {
      console.info("[REGISTRATION] recovered state invalid — clearing", { hasSuccess: result.success, hasTxHash: Boolean(result.txHash) });
      localStorage.removeItem("hs_registration_result");
      return null;
    }
    if (result.completedAt && Date.now() - result.completedAt > 30 * 60 * 1000) {
      console.info("[REGISTRATION] recovered state expired — clearing", { completedAt: result.completedAt });
      localStorage.removeItem("hs_registration_result");
      return null;
    }
    console.info("[REGISTRATION] recovered registration from localStorage", {
      txHash: result.txHash,
      hlAddress: result.hlAddress,
      registrationStatus: result.registrationStatus,
    });
    localStorage.removeItem("hs_registration_result");
    return result;
  } catch (err) {
    console.warn("[REGISTRATION] failed to parse recovered state", { error: err?.message });
    return null;
  }
}

export function RegistrationFlow({
  initialMinerSlug = DEFAULT_MINER_SLUG,
  initialMinerTiers = null,
  initialPaymentWallet = null,
  logo = "/hyperscaled-logo.svg",
  logoAlt = "Hyperscaled",
  homeHref,
  logoHref,
  brandVariant = "hyperscaled",
}) {
  const brandHref = useBrandHref();
  // Exit button always returns to the brand's in-app home so users stay in
  // the funnel context. Logo can optionally point to an external brand site
  // (e.g. white-label partner's marketing domain) via `logoHref`.
  const resolvedExitHref = homeHref ?? brandHref("/");
  const resolvedLogoHref = logoHref ?? resolvedExitHref;
  const searchParams = useSearchParams();
  const {
    capacity,
    freeAtCapacity,
    paidAtCapacity,
    registrationFullyClosed,
  } = useRegistrationCapacity();

  const [recovered] = useState(getRecoveredRegistration);
  // Read `?tier` once at mount; re-reading would yank the user forward
  // if they hit "Back" and stripped the param.
  const initialTierParamRef = useRef(searchParams?.get("tier") ?? null);
  // When SSR provides tiers we resolve the deep-link synchronously and
  // seed currentStep=1 below — that avoids a flash of step 0. The
  // effect further down is the fallback for the rare case where SSR
  // failed to load tiers and the client refetches.
  const initialPreselect = useRef(
    recovered ? null : resolveTierParam(initialTierParamRef.current, initialMinerTiers),
  ).current;
  const tierPreselectAppliedRef = useRef(initialPreselect != null);

  const [currentStep, setCurrentStep] = useState(
    recovered ? 3 : initialPreselect ? 1 : 0,
  );
  const [selectedTier, setSelectedTier] = useState(
    recovered
      ? {
          name: recovered.tierName || "Challenge",
          accountSize: recovered.accountSize || 0,
          details: [],
        }
      : (initialPreselect?.tier ?? null),
  );
  const [selectedTierIndex, setSelectedTierIndex] = useState(
    initialPreselect?.index ?? null,
  );
  const [txHash, setTxHash] = useState(recovered?.txHash ?? null);
  const [hlAddress, setHlAddress] = useState(recovered?.hlAddress ?? null);
  const [registrationStatus, setRegistrationStatus] = useState(recovered?.registrationStatus ?? null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(recovered ? "hyperliquid" : null);
  const [minerTiers, setMinerTiers] = useState(initialMinerTiers);
  const [paymentWallet, setPaymentWallet] = useState(initialPaymentWallet);

  // Load tiers/wallet once per slug. Do not list minerTiers/paymentWallet in deps —
  // that re-ran the effect after every fetch and could loop (e.g. [] tiers + wallet).
  useEffect(() => {
    const haveTiers = Array.isArray(minerTiers) && minerTiers.length > 0;
    if (haveTiers && paymentWallet) return;

    console.info("[REGISTRATION] fetching miner tiers", { initialMinerSlug });
    fetch(`/api/miners/${initialMinerSlug}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        const nextTiers = Array.isArray(data.tiers) ? data.tiers : [];
        console.info("[REGISTRATION] miner tiers loaded", {
          initialMinerSlug,
          tiers: nextTiers.length,
          usdcWallet: data.usdcWallet,
        });
        setMinerTiers(nextTiers);
        setPaymentWallet(data.usdcWallet);
      })
      .catch((err) => {
        console.warn("[REGISTRATION] miner API unavailable — using empty tiers", { initialMinerSlug, err });
        setMinerTiers([]);
        setPaymentWallet(MOCK_WALLET);
        // If this branch fires in prod, paymentWallet is 0x000…000 and any
        // downstream payment would target the zero address. Must page on this.
        reportCritical(
          err instanceof Error ? err : new Error(`miner API fetch failed: ${err}`),
          {
            source: "RegistrationFlow",
            metadata: {
              step: "miner_api_fallback_to_mock_wallet",
              minerSlug: initialMinerSlug,
              status: typeof err === "number" ? err : undefined,
            },
          },
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: guard uses initial state only; deps would refetch in a loop
  }, [initialMinerSlug]);


  // Funnel entry event. When recovered, fire a recovery event instead of
  // register_intent so the conversion still appears in analytics.
  useEffect(() => {
    if (recovered) {
      trackEvent("register_conversion_recovered", {
        tier_name: recovered.tierName,
        ref_source: getRefSource(),
        brand_variant: brandVariant,
      });
      return;
    }
    trackEvent("register_intent", {
      ref_source: getRefSource(),
      brand_variant: brandVariant,
    });
    if (initialPreselect) {
      trackEvent("register_tier_selected", {
        tier_name: initialPreselect.tier?.name,
        tier_price:
          initialPreselect.tier?.promoPrice ?? initialPreselect.tier?.fullPrice,
        ref_source: getRefSource(),
        brand_variant: brandVariant,
        preselected: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on mount
  }, []);

  // Async fallback: apply the deep-link after the client-side tier
  // refetch (when SSR didn't provide tiers). The synchronous initializer
  // above handles the common case.
  useEffect(() => {
    if (tierPreselectAppliedRef.current) return;
    if (recovered) return;
    const match = resolveTierParam(initialTierParamRef.current, minerTiers);
    if (!match) {
      if (
        initialTierParamRef.current &&
        Array.isArray(minerTiers) &&
        minerTiers.length > 0
      ) {
        console.warn("[REGISTRATION] ?tier param did not match any miner tier", {
          requested: initialTierParamRef.current,
          availableSizes: minerTiers.map((t) => t.accountSize),
        });
        tierPreselectAppliedRef.current = true;
      }
      return;
    }
    setSelectedTier(match.tier);
    setSelectedTierIndex(match.index);
    const blocked =
      capacity != null &&
      tierBlockedForCaps(match.tier, freeAtCapacity, paidAtCapacity);
    setCurrentStep(blocked ? 0 : 1);
    if (!blocked) {
      trackEvent("register_tier_selected", {
        tier_name: match.tier?.name,
        tier_price: match.tier?.promoPrice ?? match.tier?.fullPrice,
        ref_source: getRefSource(),
        brand_variant: brandVariant,
        preselected: true,
      });
    } else {
      console.info("[REGISTRATION] ?tier blocked by capacity — staying on step 0", {
        accountSize: match.tier?.accountSize,
        freeAtCapacity,
        paidAtCapacity,
      });
    }
    tierPreselectAppliedRef.current = true;
  }, [minerTiers, recovered, brandVariant, capacity, freeAtCapacity, paidAtCapacity]);

  // When both registration buckets are full, never leave users on Connect/Pay.
  useEffect(() => {
    if (!registrationFullyClosed || recovered) return;
    if (currentStep === 1 || currentStep === 2) {
      setCurrentStep(0);
    }
  }, [registrationFullyClosed, recovered, currentStep]);

  // If capacity loads after we already advanced (e.g. SSR preselect → step 1),
  // snap back when the selected tier is no longer startable.
  useEffect(() => {
    if (!capacity || recovered) return;
    if (currentStep !== 1 && currentStep !== 2) return;
    const tier = selectedTier;
    if (!tier || !tierBlockedForCaps(tier, freeAtCapacity, paidAtCapacity)) {
      return;
    }
    console.info("[REGISTRATION] capacity blocks selected tier — returning to step 0", {
      accountSize: tier.accountSize,
      freeAtCapacity,
      paidAtCapacity,
    });
    setCurrentStep(0);
  }, [capacity, recovered, currentStep, selectedTier, freeAtCapacity, paidAtCapacity]);

  // B1: Browser refresh guard — only during active payment processing
  useEffect(() => {
    if (!paymentProcessing) return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [paymentProcessing]);

  // Steps 1 (Connect & Pay) and 2 (Confirm) share StepConnectAndPay to keep
  // wagmi/extension hooks mounted. We render it in both phases but only show
  // the active phase's UI via the `phase` prop.
  const isConnectOrConfirm = currentStep === 1 || currentStep === 2;

  return (
    <main className="min-h-dvh flex flex-col bg-background text-foreground">
      {/* D2: Minimal nav bar */}
      <nav className="shrink-0 flex items-center justify-between py-4 px-6 w-full max-w-5xl mx-auto">
        <Link
          href={resolvedLogoHref}
          data-testid="register-logo-link"
          className="outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <img
            src={logo}
            alt={logoAlt}
            className="h-7 w-auto"
          />
        </Link>
        <Link href={resolvedExitHref} data-testid="register-exit-link">
          <Button
            variant="outline"
            className="text-sm h-11 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 cursor-pointer"
          >
            Exit
          </Button>
        </Link>
      </nav>

      {/* Flow content */}
      {isConnectOrConfirm ? (
        <div className="flex-1 flex flex-col min-h-0 w-full">
        {/* Steps 1–2: Two-column layout with help sidebar */}
        <Providers>
          <RegistrationHelpProvider>
            <div className="flex-1 flex flex-col min-h-0 lg:flex-row lg:justify-center lg:items-start gap-0 lg:gap-8 pt-6 pb-20 px-4 lg:px-8 w-full">
              {/* Form column */}
              <div className="w-full lg:max-w-[640px] lg:shrink-0">
                <Stepper
                  currentStep={currentStep}
                  steps={STEP_LABELS}
                />
                <StepConnectAndPay
                  selectedTier={selectedTier}
                  tierIndex={selectedTierIndex}
                  minerSlug={initialMinerSlug}
                  paymentWallet={paymentWallet}
                  phase={currentStep === 2 ? "confirm" : "connect"}
                  brandVariant={brandVariant}
                  onContinueToConfirm={() => { console.info("[REGISTRATION] advance: 1 -> 2 (confirm)"); setCurrentStep(2); }}
                  onPaymentProcessing={setPaymentProcessing}
                  onPaymentComplete={({ txHash: hash, hlAddress: addr, registrationStatus: status, paymentMethod: method }) => {
                    console.info("[REGISTRATION] onPaymentComplete", {
                      txHash: hash,
                      hlAddress: addr,
                      registrationStatus: status,
                      paymentMethod: method,
                    });
                    setPaymentProcessing(false);
                    setTxHash(hash);
                    setHlAddress(addr);
                    setRegistrationStatus(status);
                    setPaymentMethod(method || null);
                    setCurrentStep(3);
                  }}
                  onBack={currentStep === 2 ? () => { console.info("[REGISTRATION] back: 2 -> 1"); setCurrentStep(1); } : () => { console.info("[REGISTRATION] back: 1 -> 0"); setCurrentStep(0); }}
                />
              </div>

              {/* Desktop sidebar */}
              <RegistrationSidebar />
            </div>
            <MobileHelpSheet />
          </RegistrationHelpProvider>
        </Providers>
        </div>
      ) : (
        /* Steps 0 and 3: Single-column centered layout */
        <div className="flex-1 flex flex-col items-center w-full min-h-0 pt-6 pb-20 px-4 bg-background">
          <div className={`w-full flex-1 flex flex-col ${currentStep === 3 ? "max-w-5xl" : currentStep === 0 ? "max-w-7xl" : "max-w-3xl"}`}>
            {currentStep === 3 ? (
              <div className="mb-10 flex justify-center">
                <p className="text-sm font-medium text-teal-400">
                  Registration complete
                </p>
              </div>
            ) : (
              <Stepper
                currentStep={currentStep}
                steps={STEP_LABELS}
              />
            )}

            {currentStep === 0 && (
              <StepSelectTier
                tiers={minerTiers}
                selectedTier={selectedTier}
                selectedTierIndex={selectedTierIndex}
                onSelect={(tier, indexFromStep) => {
                  if (!tier) return;
                  const list = minerTiers;
                  const idx =
                    Number.isInteger(indexFromStep) && indexFromStep >= 0
                      ? indexFromStep
                      : findTierIndexInList(list, tier);
                  const canonical =
                    Array.isArray(list) && list[idx] != null ? list[idx] : tier;
                  setSelectedTier(canonical);
                  setSelectedTierIndex(idx);
                }}
                onContinue={(tierFromStep, indexFromStep) => {
                  let canonical = selectedTier;
                  if (tierFromStep) {
                    const list = minerTiers;
                    const idx =
                      Number.isInteger(indexFromStep) && indexFromStep >= 0
                        ? indexFromStep
                        : findTierIndexInList(list, tierFromStep);
                    canonical =
                      Array.isArray(list) && list[idx] != null ? list[idx] : tierFromStep;
                    setSelectedTier(canonical);
                    setSelectedTierIndex(idx);
                    console.info("[REGISTRATION] tier selected, advancing 0 -> 1", {
                      tierIndex: idx,
                      accountSize: canonical?.accountSize,
                      name: canonical?.name,
                    });
                  } else {
                    console.info("[REGISTRATION] advance: 0 -> 1 (no tier change)");
                  }

                  if (!canonical || tierBlockedForCaps(canonical, freeAtCapacity, paidAtCapacity)) {
                    if (canonical) {
                      console.warn("[REGISTRATION] blocked continue — tier at capacity");
                    }
                    return;
                  }

                  trackEvent("register_tier_selected", {
                    tier_name: canonical?.name,
                    tier_price: canonical?.promoPrice ?? canonical?.fullPrice,
                    ref_source: getRefSource(),
                    brand_variant: brandVariant,
                  });
                  setCurrentStep(1);
                }}
              />
            )}

            {/* Step 3: Done */}
            {currentStep === 3 && (
              <StepConfirmation
                selectedTier={selectedTier}
                hlAddress={hlAddress}
                txHash={txHash}
                registrationStatus={registrationStatus}
                paymentMethod={paymentMethod}
                brandVariant={brandVariant}
              />
            )}
          </div>
        </div>
      )}

    </main>
  );
}
