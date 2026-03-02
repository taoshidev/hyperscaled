"use client";

import { Check } from "lucide-react";

const STEP_LABELS = ["Tier", "Wallet", "Email", "Payment", "Done"];

export function Stepper({ currentStep, minerColor }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: isCompleted || isActive ? minerColor : "transparent",
                  border: isCompleted || isActive ? "none" : "1px solid rgba(255,255,255,0.2)",
                  color: isCompleted || isActive ? "#fff" : "rgba(255,255,255,0.4)",
                }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: isCompleted || isActive ? minerColor : "rgba(255,255,255,0.4)" }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className="w-8 h-px mb-4"
                style={{ backgroundColor: i < currentStep ? minerColor : "rgba(255,255,255,0.1)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
