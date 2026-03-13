"use client";

import { useState } from "react";
import { Stepper } from "./stepper";
import { StepSelectTier } from "./step-select-tier";
import { StepHLAddress } from "./step-hl-address";
import { StepEmail } from "./step-email";
import { StepPayment } from "./step-payment";
import { StepConfirmation } from "./step-confirmation";

export function RegistrationFlow({ miner, minerWallet }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    tierIndex: null,
    hlAddress: "",
    email: "",
    txHash: null,
    payerAddress: null,
    registrationStatus: null,
    registrationMessage: "",
  });

  function update(fields) {
    setFormData((prev) => ({ ...prev, ...fields }));
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-12 pb-20 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: miner.color }}>
            {miner.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Entity Miner Registration</p>
        </div>

        <Stepper currentStep={step} minerColor={miner.color} />

        {step === 0 && (
          <StepSelectTier
            miner={miner}
            onSelect={(tierIndex) => {
              update({ tierIndex });
              setStep(1);
            }}
          />
        )}

        {step === 1 && (
          <StepHLAddress
            miner={miner}
            value={formData.hlAddress}
            onChange={(hlAddress) => update({ hlAddress })}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && (
          <StepEmail
            miner={miner}
            value={formData.email}
            onChange={(email) => update({ email })}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <StepPayment
            miner={miner}
            minerWallet={minerWallet}
            tierIndex={formData.tierIndex}
            hlAddress={formData.hlAddress}
            email={formData.email}
            onComplete={(result) => {
              update(result);
              setStep(4);
            }}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <StepConfirmation
            miner={miner}
            tierIndex={formData.tierIndex}
            hlAddress={formData.hlAddress}
            txHash={formData.txHash}
            payerAddress={formData.payerAddress}
            registrationStatus={formData.registrationStatus}
          />
        )}
      </div>
    </div>
  );
}
