"use client";

import { useRef, useCallback } from "react";
import { Check, ArrowRight } from "@phosphor-icons/react";
import { TIERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { formatAccountSize } from "@/lib/format";

function savingsPercent(full, promo) {
  return Math.round(((full - promo) / full) * 100);
}

function formatPrice(price) {
  return `$${price}`;
}

export function StepSelectTier({ selectedTier, onSelect, onContinue }) {
  const cardRefs = useRef([]);

  const handleKeyDown = useCallback(
    (e, tier, index) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(tier);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (index + 1) % TIERS.length;
        cardRefs.current[next]?.focus();
        onSelect(TIERS[next]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (index - 1 + TIERS.length) % TIERS.length;
        cardRefs.current[prev]?.focus();
        onSelect(TIERS[prev]);
      }
    },
    [onSelect],
  );

  return (
    <div className="flex flex-col">
      {/* Promo banner */}
      <div className="flex justify-center">
        <p className="bg-teal-400/10 text-teal-400 text-sm font-medium px-4 py-2 rounded-lg text-center text-balance">
          Launch pricing — up to 55% off all evaluations
        </p>
      </div>

      {/* Header */}
      <div className="text-center space-y-2 mt-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Choose your funded account size
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto text-balance">
          One evaluation. No recurring fees. 100%&nbsp;of performance
          rewards are&nbsp;yours.
        </p>
      </div>

      {/* Tier cards — accessible radio group */}
      <div
        role="radiogroup"
        aria-label="Choose your funded account size"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10"
      >
        {TIERS.map((tier, i) => {
          const isSelected = selectedTier?.id === tier.id;
          const isPopular = tier.badge !== null;
          const savings = savingsPercent(tier.fullPrice, tier.promoPrice);

          return (
            <div
              key={tier.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${tier.name} plan — ${formatAccountSize(tier.accountSize)} funded account — ${formatPrice(tier.promoPrice)}`}
              tabIndex={isSelected || (!selectedTier && i === 0) ? 0 : -1}
              onClick={() => onSelect(tier)}
              onKeyDown={(e) => handleKeyDown(e, tier, i)}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`
                relative cursor-pointer rounded-2xl border p-6 group
                bg-zinc-900/50 text-card-foreground
                transition-[border-color,box-shadow,transform,opacity] duration-200
                animate-[fadeInUp_0.35s_ease-out_both]
                outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                ${isSelected
                  ? "border-teal-400 shadow-[0_0_20px_rgba(0,198,167,0.15)]"
                  : isPopular
                    ? "border-white/[0.15] hover:border-white/[0.20]"
                    : "border-white/[0.06] hover:border-white/[0.10]"
                }
                ${selectedTier && !isSelected ? "opacity-70" : ""}
                ${isPopular ? "md:scale-[1.02] md:z-10" : ""}
              `}
            >
              {/* Hover glow — persistent when selected */}
              <div
                className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                style={{ background: 'radial-gradient(circle at 20% 20%, rgba(0,198,167,0.06), transparent 60%)' }}
              />

              {/* Popular badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-teal-400 text-zinc-950">
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className={`${isPopular ? "mt-2" : ""}`}>
                <span className="text-xs font-semibold uppercase tracking-widest text-[oklch(0.65_0_0)]">
                  {tier.name}
                </span>
              </div>

              {/* Account size */}
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold tracking-tight">
                  {formatAccountSize(tier.accountSize)}
                </span>
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2.5 mb-1">
                <ins className="no-underline">
                  <span className="sr-only">Sale price: </span>
                  <span className="text-2xl font-bold text-teal-400">
                    {formatPrice(tier.promoPrice)}
                  </span>
                </ins>
                <del>
                  <span className="sr-only">Original price: </span>
                  <span className="text-sm text-[oklch(0.65_0_0)]">
                    {formatPrice(tier.fullPrice)}
                  </span>
                </del>
              </div>

              {/* Savings badge */}
              <div className="mb-5">
                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-teal-400/10 text-teal-400 border border-teal-400/20">
                  {savings}% off
                </span>
              </div>

              {/* Separator */}
              <div className="border-t border-border mb-4" />

              {/* Details — label/value rows */}
              <div className="space-y-2.5">
                {tier.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-[oklch(0.65_0_0)]">
                      {detail.label}
                    </span>
                    <span className="text-foreground font-medium font-mono">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center transition-opacity duration-150">
                  <Check size={12} weight="bold" className="text-zinc-950" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <div className="flex justify-center mt-8">
        {selectedTier ? (
          <button
            type="button"
            onClick={onContinue}
            className="shiny-cta h-11 px-8 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
              Continue
              <ArrowRight size={15} weight="bold" />
            </span>
          </button>
        ) : (
          <Button
            disabled
            className="px-8 h-11 text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
          >
            Continue
            <ArrowRight size={15} weight="bold" className="ml-1.5" />
          </Button>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground mt-6">
        You&#8217;ll connect your wallet to pay with USDC on Base in the next
        step.
      </p>
    </div>
  );
}
