"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Stepper } from "./stepper";
import { StepSelectTier } from "./step-select-tier";
import { StepConnectAndPay } from "./step-connect-pay";
import { StepConfirmation } from "./step-confirmation";

const STEP_LABELS = ["Select Plan", "Connect & Pay", "Confirmation"];

export function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [hlAddress, setHlAddress] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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

  return (
    <main className="min-h-[100dvh] flex flex-col">
      {/* D2: Minimal nav bar */}
      <nav className="flex items-center justify-between py-4 px-6 w-full max-w-5xl mx-auto">
        <Link href="/" className="outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
          <img
            src="/hyperscaled-logo.svg"
            alt="Hyperscaled"
            className="h-7 w-auto"
          />
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            className="text-sm h-9 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 cursor-pointer"
          >
            Exit
          </Button>
        </Link>
      </nav>

      {/* Flow content */}
      <div className="flex-1 flex flex-col items-center justify-start pt-6 pb-20 px-4">
        <div className="w-full max-w-3xl">
          {/* Stepper */}
          <Stepper
            currentStep={currentStep === 2 ? 3 : currentStep}
            steps={STEP_LABELS}
          />

          {/* Step 0: Tier selection */}
          {currentStep === 0 && (
            <StepSelectTier
              selectedTier={selectedTier}
              onSelect={setSelectedTier}
              onContinue={() => setCurrentStep(1)}
            />
          )}

          {/* Step 1: Connect & Pay */}
          {currentStep === 1 && (
            <StepConnectAndPay
              selectedTier={selectedTier}
              onPaymentProcessing={setPaymentProcessing}
              onPaymentComplete={({ txHash: hash, hlAddress: addr }) => {
                setPaymentProcessing(false);
                setTxHash(hash);
                setHlAddress(addr);
                setCurrentStep(2);
              }}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {/* Step 2: Confirmation */}
          {currentStep === 2 && (
            <StepConfirmation
              selectedTier={selectedTier}
              hlAddress={hlAddress}
              txHash={txHash}
            />
          )}
        </div>
      </div>
    </main>
  );
}
