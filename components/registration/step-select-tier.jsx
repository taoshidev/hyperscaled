"use client";

import { useRef, useCallback } from "react";
import { Check, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
// import { formatAccountSize } from "@/lib/format";

function formatPrice(price) {
  return `$${price}`;
}

function formatShortName(accountSize) {
  if (accountSize >= 1000000) return `$${accountSize / 1000000}M Account`;
  return `$${accountSize / 1000}K Account`;
}

export function StepSelectTier({ tiers, selectedTier, onSelect, onContinue }) {
  const cardRefs = useRef([]);

  const handleKeyDown = useCallback(
    (e, tier, index) => {
      if (!tiers) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(tier);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (index + 1) % tiers.length;
        cardRefs.current[next]?.focus();
        onSelect(tiers[next]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (index - 1 + tiers.length) % tiers.length;
        cardRefs.current[prev]?.focus();
        onSelect(tiers[prev]);
      }
    },
    [onSelect, tiers],
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
        {!tiers
          ? [0, 1, 2].map((i) => (
              <div key={i} className="skeleton rounded-2xl h-72" />
            ))
          : tiers.map((tier, i) => {
          const isSelected = selectedTier?.id === tier.id;
          const isPopular = tier.badge !== null;

          return (
            <div
              key={tier.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${tier.name} — ${formatShortName(tier.accountSize)} funded account — ${formatPrice(tier.promoPrice)}`}
              tabIndex={isSelected || (!selectedTier && i === 0) ? 0 : -1}
              onClick={() => onSelect(tier)}
              onKeyDown={(e) => handleKeyDown(e, tier, i)}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`
                relative cursor-pointer rounded-2xl p-6 group
                text-card-foreground
                transition-[border-color,box-shadow,transform,opacity] duration-200
                animate-[fadeInUp_0.35s_ease-out_both]
                outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                ${isSelected
                  ? "shiny-border"
                  : `border bg-zinc-900/50 ${isPopular
                      ? "border-white/[0.15] hover:border-white/[0.20]"
                      : "border-white/[0.06] hover:border-white/[0.10]"
                    }`
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
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-teal-400 text-zinc-950">
                    <Star size={12} weight="fill" />
                    {tier.badge}
                  </span>
                </div>
              )}

              {/* Tier name */}
              <div className={`${isPopular ? "mt-2" : ""}`}>
                <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {tier.name}
                </span>
              </div>

              {/* Account size label */}
              <div className="text-lg font-semibold text-white mt-1">
                {formatShortName(tier.accountSize)}
              </div>

              {/* Pricing */}
              <div className="flex items-baseline gap-2 mt-3 mb-5">
                <ins className="no-underline">
                  <span className="sr-only">Sale price: </span>
                  <span className="text-3xl font-bold font-mono text-white">
                    {formatPrice(tier.promoPrice)}
                  </span>
                </ins>
                <del className="text-sm text-zinc-600 font-mono" style={{ textDecorationThickness: '1px', textUnderlineOffset: '-3px' }}>
                  <span className="sr-only">Original price: </span>
                  {formatPrice(tier.fullPrice)}
                </del>
                <span className="text-xs text-zinc-500 font-medium">USDC</span>
              </div>

              {/* Separator */}
              <div className="border-t border-border mb-4" />

              {/* Details — label/value rows */}
              <div className="space-y-2.5">
                {tier.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-zinc-500">
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
