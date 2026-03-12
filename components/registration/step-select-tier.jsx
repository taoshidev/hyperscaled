"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "@phosphor-icons/react";
import { TIERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

function savingsPercent(full, promo) {
  return Math.round(((full - promo) / full) * 100);
}

function formatAccountSize(size) {
  return `$${size.toLocaleString("en-US")}`;
}

function formatPrice(price) {
  return `$${price}`;
}

export function StepSelectTier({ selectedTier, onSelect, onContinue }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Choose your funded account size
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          One evaluation. No recurring fees. 100% of performance rewards are
          yours.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((tier, i) => {
          const isSelected = selectedTier?.id === tier.id;
          const isPopular = tier.badge !== null;
          const savings = savingsPercent(tier.fullPrice, tier.promoPrice);

          return (
            <div
              key={tier.id}
              onClick={() => onSelect(tier)}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`
                relative cursor-pointer rounded-xl border p-6
                bg-card text-card-foreground
                transition-all duration-200
                animate-[fadeInUp_0.35s_ease-out_both]
                ${isSelected
                  ? "border-teal-400 shadow-[0_0_20px_rgba(0,198,167,0.15)]"
                  : "border-border hover:border-white/20"
                }
                ${isPopular ? "md:scale-[1.03] md:z-10" : ""}
              `}
            >
              {/* Popular badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-400 text-zinc-950">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className={`${isPopular ? "mt-2" : ""}`}>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {tier.name}
                </span>
              </div>

              {/* Account size */}
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold font-mono tracking-tight">
                  {formatAccountSize(tier.accountSize)}
                </span>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2.5 mb-1">
                <span className="text-2xl font-bold text-teal-400 font-mono">
                  {formatPrice(tier.promoPrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through font-mono">
                  {formatPrice(tier.fullPrice)}
                </span>
              </div>

              {/* Savings badge */}
              <div className="mb-5">
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-400/10 text-teal-400 border border-teal-400/20">
                  {savings}% off
                </span>
              </div>

              {/* Details */}
              <ul className="space-y-2">
                {tier.details.map((detail) => (
                  <li
                    key={detail}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <Check
                      size={12}
                      weight="bold"
                      className="text-teal-400 shrink-0"
                    />
                    {detail}
                  </li>
                ))}
              </ul>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-4 right-4 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center"
                >
                  <Check size={12} weight="bold" className="text-zinc-950" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <div className="flex justify-center">
        <Button
          onClick={onContinue}
          disabled={!selectedTier}
          className="px-8 py-3 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Continue
          <ArrowRight size={15} weight="bold" className="ml-1.5" />
        </Button>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-center text-muted-foreground">
        You&apos;ll connect your wallet to pay with USDC on Base in the next
        step.
      </p>
    </div>
  );
}
