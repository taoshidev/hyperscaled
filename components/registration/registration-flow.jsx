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
import { clearConnectDraft } from "@/lib/registration-connect-draft";

const STEP_LABELS = ["Select Plan", "Connect & Pay", "Confirm", "Done"];
const DEFAULT_MINER_SLUG = "vanta";
const CHECKOUT_STATE_STORAGE_KEY = "hs_register_checkout_state";
const CHECKOUT_STATE_TTL_MS = 30 * 60 * 1000;

const MOCK_WALLET = "0x0000000000000000000000000000000000000000";

/**
 * Persist checkout step + tier identity so a remount (wallet modal, error
 * boundary reset) can restore both. Step alone is not enough — without
 * accountSize, StepConnectAndPay crashes on selectedTier.accountSize.
 */
function readPersistedCheckoutState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STATE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.savedAt && Date.now() - data.savedAt > CHECKOUT_STATE_TTL_MS) {
      sessionStorage.removeItem(CHECKOUT_STATE_STORAGE_KEY);
      return null;
    }
    const step = Number(data.step);
    const accountSize = Number(data.accountSize);
    if ((step !== 1 && step !== 2) || !Number.isFinite(accountSize) || accountSize <= 0) {
      return null;
    }
    return {
      step,
      accountSize,
      tierIndex: Number.isInteger(data.tierIndex) ? data.tierIndex : null,
    };
  } catch {
    return null;
  }
}

function persistCheckoutState({ step, accountSize, tierIndex }) {
  if (typeof window === "undefined") return;
  if ((step !== 1 && step !== 2) || !Number.isFinite(accountSize) || accountSize <= 0) {
    return;
  }
  try {
    sessionStorage.setItem(
      CHECKOUT_STATE_STORAGE_KEY,
      JSON.stringify({ step, accountSize, tierIndex, savedAt: Date.now() }),
    );
  } catch {
    /* private browsing / quota */
  }
}

function clearPersistedCheckoutState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(CHECKOUT_STATE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

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
  const resolvedExitHref = homeHref ?? brandHref("/");
  const resolvedLogoHref = logoHref ?? resolvedExitHref;
  const searchParams = useSearchParams();
  const {
    capacity,
    freeAtCapacity,
    paidAtCapacity,
    registrationFullyClosed,
  } = useRegistrationCapacity(initialMinerSlug);

  // Browser storage is read only after mount so SSR and the first client
  // paint match (avoids hydration mismatch on checkout layout vs tier step).
  const [hasHydrated, setHasHydrated] = useState(false);
  const hasHydratedRef = useRef(false);
  const [isRecoveredSession, setIsRecoveredSession] = useState(false);
  const recoveredDataRef = useRef(null);

  // Read once at mount so a back-nav that strips params doesn't yank the user forward.
  const initialTierParamRef = useRef(searchParams?.get("tier") ?? null);
  const initialPromoParamRef = useRef(searchParams?.get("promo") ?? null);
  // Resolve synchronously when SSR provided tiers, else the effect below handles it.
  const initialPreselect = useRef(
    resolveTierParam(initialTierParamRef.current, initialMinerTiers),
  ).current;
  const tierPreselectAppliedRef = useRef(initialPreselect != null);
  // Once the user has entered checkout, capacity / closure effects must not
  // snap them back to tier selection (e.g. when capacity loads late).
  const persistedCheckoutRef = useRef(null);
  const hasEnteredCheckoutRef = useRef(initialPreselect != null);

  const [currentStep, setCurrentStep] = useState(() => (initialPreselect ? 1 : 0));
  const [selectedTier, setSelectedTier] = useState(initialPreselect?.tier ?? null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(
    initialPreselect?.index ?? null,
  );

  const goToStep = (step) => {
    if ((step === 1 || step === 2) && selectedTier?.accountSize) {
      persistCheckoutState({
        step,
        accountSize: selectedTier.accountSize,
        tierIndex: selectedTierIndex,
      });
    } else if (step === 0 || step === 3) {
      clearPersistedCheckoutState();
    }
    setCurrentStep(step);
  };
  const [txHash, setTxHash] = useState(null);
  const [hlAddress, setHlAddress] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [minerTiers, setMinerTiers] = useState(initialMinerTiers);
  const [paymentWallet, setPaymentWallet] = useState(initialPaymentWallet);

  useEffect(() => {
    const recovery = getRecoveredRegistration();
    if (recovery) {
      recoveredDataRef.current = recovery;
      setIsRecoveredSession(true);
      setSelectedTier({
        name: recovery.tierName || "Challenge",
        accountSize: recovery.accountSize || 0,
        details: [],
      });
      setCurrentStep(3);
      setTxHash(recovery.txHash);
      setHlAddress(recovery.hlAddress);
      setRegistrationStatus(recovery.registrationStatus ?? null);
      setPaymentMethod("hyperliquid");
      hasEnteredCheckoutRef.current = true;
      hasHydratedRef.current = true;
      setHasHydrated(true);
      trackEvent("register_conversion_recovered", {
        tier_name: recovery.tierName,
        ref_source: getRefSource(),
        brand_variant: brandVariant,
      });
      return;
    }

    const persisted = readPersistedCheckoutState();
    persistedCheckoutRef.current = persisted;
    if (persisted?.step === 1 || persisted?.step === 2) {
      setCurrentStep(persisted.step);
      hasEnteredCheckoutRef.current = true;
    }

    hasHydratedRef.current = true;
    setHasHydrated(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once hydrate + analytics
  }, [brandVariant, initialPreselect]);

  // Don't list minerTiers/paymentWallet in deps — would loop on empty fetches.
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
        // Mock wallet means downstream payments would target 0x000…0 — page.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMinerSlug]);

  // Rehydrate tier after remount when session has checkout step + accountSize.
  useEffect(() => {
    if (selectedTier) return;
    const persisted = persistedCheckoutRef.current;
    if (!persisted?.accountSize) return;
    if (!Array.isArray(minerTiers) || minerTiers.length === 0) return;

    const match = resolveTierParam(String(persisted.accountSize), minerTiers);
    if (match) {
      setSelectedTier(match.tier);
      setSelectedTierIndex(
        persisted.tierIndex != null && persisted.tierIndex >= 0
          ? persisted.tierIndex
          : match.index,
      );
      return;
    }

    clearPersistedCheckoutState();
    hasEnteredCheckoutRef.current = false;
    setCurrentStep(0);
  }, [minerTiers, selectedTier]);

  // Async fallback for the tier preselect when SSR didn't provide tiers.
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    if (tierPreselectAppliedRef.current) return;
    if (isRecoveredSession) return;
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
    goToStep(blocked ? 0 : 1);
    if (!blocked) {
      hasEnteredCheckoutRef.current = true;
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
  }, [minerTiers, isRecoveredSession, brandVariant, capacity, freeAtCapacity, paidAtCapacity]);

  useEffect(() => {
    if (!hasHydratedRef.current || !registrationFullyClosed || isRecoveredSession) return;
    if (hasEnteredCheckoutRef.current) return;
    if (currentStep === 1 || currentStep === 2) {
      goToStep(0);
    }
  }, [registrationFullyClosed, isRecoveredSession, currentStep]);

  // Snap back if capacity loads before checkout and the tier is no longer startable.
  useEffect(() => {
    if (!hasHydratedRef.current || !capacity || isRecoveredSession) return;
    if (hasEnteredCheckoutRef.current) return;
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
    goToStep(0);
  }, [capacity, isRecoveredSession, currentStep, selectedTier, freeAtCapacity, paidAtCapacity]);

  useEffect(() => {
    if (currentStep === 1 || currentStep === 2) {
      hasEnteredCheckoutRef.current = true;
    }
  }, [currentStep]);

  // Browser refresh guard during active payment processing.
  useEffect(() => {
    if (!paymentProcessing) return;

    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [paymentProcessing]);

  // Steps 1 + 2 share StepConnectAndPay to keep wagmi/extension hooks mounted;
  // the active sub-UI is selected via the `phase` prop.
  const isConnectOrConfirm = currentStep === 1 || currentStep === 2;

  return (
    <main className="min-h-dvh flex flex-col bg-background text-foreground">
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

      <Providers>
      {!hasHydrated ? (
        <div className="flex-1 flex items-center justify-center px-4 pb-20">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      ) : (
      isConnectOrConfirm ? (
        <div className="flex-1 flex flex-col min-h-0 w-full">
          <RegistrationHelpProvider>
            <div className="flex-1 flex flex-col min-h-0 lg:flex-row lg:justify-center lg:items-start gap-0 lg:gap-8 pt-6 pb-20 px-4 lg:px-8 w-full">
              <div className="w-full lg:max-w-[640px] lg:shrink-0">
                <Stepper
                  currentStep={currentStep}
                  steps={STEP_LABELS}
                />
                {!selectedTier ? (
                  <p className="mt-8 text-sm text-muted-foreground text-center">
                    Loading checkout…
                  </p>
                ) : (
                <StepConnectAndPay
                  selectedTier={selectedTier}
                  tierIndex={selectedTierIndex}
                  minerSlug={initialMinerSlug}
                  paymentWallet={paymentWallet}
                  initialPromoCode={initialPromoParamRef.current}
                  phase={currentStep === 2 ? "confirm" : "connect"}
                  brandVariant={brandVariant}
                  onContinueToConfirm={() => {
                    console.info("[REGISTRATION] advance: 1 -> 2 (confirm)");
                    goToStep(2);
                  }}
                  onPaymentProcessing={setPaymentProcessing}
                  onPaymentComplete={({ txHash: hash, hlAddress: addr, registrationStatus: status, paymentMethod: method }) => {
                    console.info("[REGISTRATION] onPaymentComplete", {
                      txHash: hash,
                      hlAddress: addr,
                      registrationStatus: status,
                      paymentMethod: method,
                    });
                    clearConnectDraft();
                    setPaymentProcessing(false);
                    setTxHash(hash);
                    setHlAddress(addr);
                    setRegistrationStatus(status);
                    setPaymentMethod(method || null);
                    goToStep(3);
                  }}
                  onBack={
                    currentStep === 2
                      ? () => {
                          console.info("[REGISTRATION] back: 2 -> 1");
                          goToStep(1);
                        }
                      : () => {
                          console.info("[REGISTRATION] back: 1 -> 0");
                          hasEnteredCheckoutRef.current = false;
                          clearPersistedCheckoutState();
                          goToStep(0);
                        }
                  }
                />
                )}
              </div>

              <RegistrationSidebar />
            </div>
            <MobileHelpSheet />
          </RegistrationHelpProvider>
        </div>
      ) : (
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
                capacityMinerSlug={initialMinerSlug}
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

                  tierPreselectAppliedRef.current = true;
                  hasEnteredCheckoutRef.current = true;
                  trackEvent("register_tier_selected", {
                    tier_name: canonical?.name,
                    tier_price: canonical?.promoPrice ?? canonical?.fullPrice,
                    ref_source: getRefSource(),
                    brand_variant: brandVariant,
                  });
                  goToStep(1);
                }}
              />
            )}

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
      )
      )}
      </Providers>

    </main>
  );
}
