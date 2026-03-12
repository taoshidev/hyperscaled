"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "@phosphor-icons/react";

export function Stepper({ currentStep, steps }) {
  return (
    <ol className="flex items-center justify-center gap-0 mb-10" aria-label="Registration progress">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isActive = i === currentStep;
        const isFuture = i > currentStep;

        return (
          <li
            key={label}
            className="flex items-center"
            aria-current={isActive ? "step" : undefined}
          >
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  opacity: 1,
                  scale: isActive ? 1 : 0.95,
                }}
                transition={{ duration: 0.2 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-200
                  ${isCompleted ? "bg-teal-400 text-white" : ""}
                  ${isActive ? "bg-teal-400 text-white" : ""}
                  ${isFuture ? "bg-transparent border border-white/15 text-white/30" : ""}
                `}
              >
                {isCompleted ? (
                  <Check size={14} weight="bold" />
                ) : isFuture ? (
                  <Circle size={8} weight="fill" className="text-white/20" />
                ) : (
                  i + 1
                )}
              </motion.div>
              <motion.span
                initial={false}
                animate={{ opacity: isActive ? 1 : isFuture ? 0.35 : 0.55 }}
                transition={{ duration: 0.2 }}
                className={`text-xs font-medium whitespace-nowrap
                  ${isActive ? "text-teal-400 font-bold" : "text-[oklch(0.65_0_0)]"}
                `}
              >
                {label}
                {isCompleted && <span className="sr-only"> (completed)</span>}
                {isActive && <span className="sr-only"> (current step)</span>}
                {isFuture && <span className="sr-only"> (upcoming)</span>}
              </motion.span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className={`w-10 sm:w-14 h-px mx-2 mb-5 transition-colors duration-200
                  ${i < currentStep ? "bg-teal-400" : "bg-white/10"}
                `}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
