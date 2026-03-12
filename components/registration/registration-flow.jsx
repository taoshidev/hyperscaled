"use client";

import { useState } from "react";
import { Stepper } from "./stepper";
import { StepSelectTier } from "./step-select-tier";

const STEP_LABELS = ["Select Plan", "Wallet", "Payment", "Confirmation"];

export function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState(null);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-start pt-12 pb-20 px-4">
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

        {/* Active step */}
        {currentStep === 0 && (
          <StepSelectTier
            selectedTier={selectedTier}
            onSelect={setSelectedTier}
            onContinue={() => setCurrentStep(1)}
          />
        )}
      </div>
    </div>
  );
}
