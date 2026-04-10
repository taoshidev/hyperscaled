"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

function getRecoveredRegistration() {
  try {
    const raw = typeof window !== "undefined"
      ? localStorage.getItem("hs_registration_result")
      : null;
    if (!raw) return null;
    const result = JSON.parse(raw);
    if (!result.success || !result.txHash) {
      localStorage.removeItem("hs_registration_result");
      return null;
    }
    if (result.completedAt && Date.now() - result.completedAt > 30 * 60 * 1000) {
      localStorage.removeItem("hs_registration_result");
      return null;
    }
    localStorage.removeItem("hs_registration_result");
    return result;
  } catch {
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
}) {
  const brandHref = useBrandHref();
  const resolvedHomeHref = homeHref ?? brandHref("/");
  const [recovered] = useState(getRecoveredRegistration);
  const [currentStep, setCurrentStep] = useState(recovered ? 3 : 0);
  const [selectedTier, setSelectedTier] = useState(recovered ? {
    name: recovered.tierName || "Challenge",
    accountSize: recovered.accountSize || 0,
    details: [],
  } : null);
  const [selectedTierIndex, setSelectedTierIndex] = useState(null);
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

    fetch(`/api/miners/${initialMinerSlug}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => {
        const nextTiers = Array.isArray(data.tiers) ? data.tiers : [];
        setMinerTiers(nextTiers);
        setPaymentWallet(data.usdcWallet);
      })
      .catch((err) => {
        console.warn("[RegistrationFlow] API unavailable, no tiers loaded:", err);
        setMinerTiers([]);
        setPaymentWallet(MOCK_WALLET);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: guard uses initial state only; deps would refetch in a loop
  }, [initialMinerSlug]);


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
    <main className="min-h-[100dvh] flex flex-col">
      {/* D2: Minimal nav bar */}
      <nav className="flex items-center justify-between py-4 px-6 w-full max-w-5xl mx-auto">
        <Link href={resolvedHomeHref} className="outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
          <img
            src={logo}
            alt={logoAlt}
            className="h-7 w-auto"
          />
        </Link>
        <Link href={resolvedHomeHref}>
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
        /* Steps 1–2: Two-column layout with help sidebar */
        <Providers>
          <RegistrationHelpProvider>
            <div className="flex-1 flex flex-col lg:flex-row lg:justify-center lg:items-start gap-0 lg:gap-8 pt-6 pb-20 px-4 lg:px-8">
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
                  onContinueToConfirm={() => setCurrentStep(2)}
                  onPaymentProcessing={setPaymentProcessing}
                  onPaymentComplete={({ txHash: hash, hlAddress: addr, registrationStatus: status, paymentMethod: method }) => {
                    setPaymentProcessing(false);
                    setTxHash(hash);
                    setHlAddress(addr);
                    setRegistrationStatus(status);
                    setPaymentMethod(method || null);
                    setCurrentStep(3);
                  }}
                  onBack={currentStep === 2 ? () => setCurrentStep(1) : () => setCurrentStep(0)}
                />
              </div>

              {/* Desktop sidebar */}
              <RegistrationSidebar />
            </div>
            <MobileHelpSheet />
          </RegistrationHelpProvider>
        </Providers>
      ) : (
        /* Steps 0 and 3: Single-column centered layout */
        <div className="flex-1 flex flex-col items-center justify-start pt-6 pb-20 px-4">
          <div className={`w-full ${currentStep === 3 ? "max-w-5xl" : currentStep === 0 ? "max-w-7xl" : "max-w-3xl"}`}>
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

            {/* Step 0: Tier selection */}
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
                  if (tierFromStep) {
                    const list = minerTiers;
                    const idx =
                      Number.isInteger(indexFromStep) && indexFromStep >= 0
                        ? indexFromStep
                        : findTierIndexInList(list, tierFromStep);
                    const canonical =
                      Array.isArray(list) && list[idx] != null ? list[idx] : tierFromStep;
                    setSelectedTier(canonical);
                    setSelectedTierIndex(idx);
                  }
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
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
