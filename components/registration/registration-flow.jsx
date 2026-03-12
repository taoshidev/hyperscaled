"use client";

import { useState } from "react";
import { Stepper } from "./stepper";
import { StepSelectTier } from "./step-select-tier";
import { StepHlAddress } from "./step-hl-address";
import { StepPayment } from "./step-payment";

const STEP_LABELS = ["Select Plan", "Wallet", "Payment", "Confirmation"];

export function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState(null);
  const [hlAddress, setHlAddress] = useState("");
  const [txHash, setTxHash] = useState(null);

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-start pt-12 pb-20 px-4">
      <div className="w-full max-w-3xl">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <img
            src="/hyperscaled-logo.svg"
            alt="Hyperscaled"
            className="h-8 w-auto"
          />
          <p className="text-xs text-muted-foreground tracking-wide">
            Vanta Trading · Entity Miner
          </p>
        </div>

        {/* Stepper */}
        <Stepper currentStep={currentStep} steps={STEP_LABELS} />

        {/* Step 0: Tier selection */}
        {currentStep === 0 && (
          <StepSelectTier
            selectedTier={selectedTier}
            onSelect={setSelectedTier}
            onContinue={() => setCurrentStep(1)}
          />
        )}

        {/* Step 1: Wallet address */}
        {currentStep === 1 && (
          <StepHlAddress
            hlAddress={hlAddress}
            setHlAddress={setHlAddress}
            selectedTier={selectedTier}
            onContinue={() => setCurrentStep(2)}
            onBack={() => setCurrentStep(0)}
          />
        )}

        {/* Step 2: Payment */}
        {currentStep === 2 && (
          <StepPayment
            selectedTier={selectedTier}
            hlAddress={hlAddress}
            onPaymentComplete={(hash) => {
              setTxHash(hash);
              setCurrentStep(3);
            }}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {/* Step 3: Confirmation — Phase 3 */}
        {currentStep === 3 && (
          <div className="text-center space-y-4 py-12 animate-[fadeInUp_0.35s_ease-out_both]">
            <h2 className="text-2xl font-semibold tracking-tight">
              Registration complete
            </h2>
            <p className="text-sm text-muted-foreground">
              Your evaluation account is being set up. This is a placeholder — full confirmation UI coming in Phase&nbsp;3.
            </p>
            {txHash && (
              <p className="text-xs font-mono text-muted-foreground break-all max-w-md mx-auto">
                tx: {txHash}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
