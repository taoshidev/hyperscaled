"use client";

import { useMemo, useRef } from "react";
import { Check, ArrowRight, Star, ArrowUpRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useBrand } from "@/lib/brand";

function formatPrice(price) {
  if (price == null || Number.isNaN(Number(price))) return "—";
  return `$${price}`;
}

function formatShortName(accountSize) {
  if (accountSize >= 1000000) return `$${accountSize / 1000000}M Account`;
  return `$${accountSize / 1000}K Account`;
}

function getTierKey(tier, index) {
  if (tier?.id != null) return `tier-${String(tier.id)}`;
  if (tier?.accountSize != null) return `tier-size-${String(tier.accountSize)}-${index}`;
  return `tier-${index}`;
}

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

function findSelectedIndex(tiers, selectedTier) {
  if (!Array.isArray(tiers) || !selectedTier) return -1;
  return tiers.findIndex((tier) => tiersMatch(selectedTier, tier));
}

export function StepSelectTier({
  tiers,
  selectedTier,
  selectedTierIndex,
  onSelect,
  onContinue,
}) {
  const cardRefs = useRef([]);

  const selectedIndex = useMemo(() => {
    if (Array.isArray(tiers) && Number.isInteger(selectedTierIndex)) {
      if (selectedTierIndex >= 0 && selectedTierIndex < tiers.length) {
        return selectedTierIndex;
      }
    }
    return findSelectedIndex(tiers, selectedTier);
  }, [tiers, selectedTier, selectedTierIndex]);
  const hasSelection = selectedIndex >= 0;

  function handleSelectIndex(index) {
    if (!Array.isArray(tiers) || !tiers[index]) return;
    onSelect?.(tiers[index], index);
  }

  function handleArrowNav(e, index) {
    if (!Array.isArray(tiers) || tiers.length === 0) return;
    if (
      e.key !== "ArrowRight" &&
      e.key !== "ArrowDown" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowUp"
    ) {
      return;
    }

    e.preventDefault();
    const isForward = e.key === "ArrowRight" || e.key === "ArrowDown";
    const nextIndex = isForward
      ? (index + 1) % tiers.length
      : (index - 1 + tiers.length) % tiers.length;

    cardRefs.current[nextIndex]?.focus();
    handleSelectIndex(nextIndex);
  }

  const brand = useBrand();

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="text-center space-y-2 mt-3">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Choose your scaled account size
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto text-balance">
          One challenge. No recurring fees. 100%&nbsp;of performance
          rewards are&nbsp;yours.
        </p>
      </div>

      {/* Powered-by callout (white-label brands only) */}
      {brand.poweredBy && brand.id !== 'hyperscaled' && (
        <div className="flex justify-center mt-4">
          <a
            href="/how-it-works"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm text-zinc-400 hover:text-white hover:border-white/[0.14] transition-[color,border-color]"
          >
            Powered by <span className="font-semibold text-white">{brand.poweredBy.name}</span>
            <ArrowUpRight size={13} weight="bold" className="text-zinc-500" />
          </a>
        </div>
      )}

      {/* Tier cards — native radio + label (reliable clicks across browsers) */}
      <div
        role="radiogroup"
        aria-label="Choose your scaled account size"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10"
      >
        {!Array.isArray(tiers)
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton rounded-2xl h-72" />
            ))
          : tiers.length === 0
          ? (
            <div className="col-span-full rounded-2xl border border-border bg-zinc-900/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No challenge tiers are available right now. Please try again in a moment.
              </p>
            </div>
          )
          : tiers.map((tier, i) => {
              const isSelected = i === selectedIndex;
              const isPopular = tier.badge != null;

              return (
                <button
                  key={getTierKey(tier, i)}
                  ref={(node) => {
                    cardRefs.current[i] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${tier.name} — ${formatShortName(tier.accountSize)} scaled account — ${formatPrice(tier.promoPrice)}`}
                  tabIndex={isSelected || (selectedIndex < 0 && i === 0) ? 0 : -1}
                  onClick={() => handleSelectIndex(i)}
                  onKeyDown={(e) => handleArrowNav(e, i)}
                  className={`
                    relative block w-full text-left cursor-pointer rounded-2xl p-6 group
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
                    ${hasSelection && !isSelected ? "opacity-70" : ""}
                  `}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {/* Hover glow — persistent when selected */}
                  <div
                    className={`absolute inset-0 rounded-2xl pointer-events-none transition-opacity ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    style={{ background: "radial-gradient(circle at 20% 20%, rgba(0,198,167,0.06), transparent 60%)" }}
                  />

                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
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
                      <span className="sr-only">Price: </span>
                      <span className="text-3xl font-bold font-mono text-white">
                        {formatPrice(tier.promoPrice)}
                      </span>
                    </ins>
                    <span className="text-xs text-zinc-500 font-medium">USDC</span>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-border mb-4" aria-hidden="true" />

                  {/* Details — label/value rows */}
                  <div className="space-y-2.5">
                    {(tier.details ?? []).map((detail) => (
                      <div
                        key={detail.label}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-zinc-500 shrink-0">{detail.label}</span>
                        <span className="text-foreground font-medium font-mono text-right">
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center transition-opacity duration-150 pointer-events-none">
                      <Check size={12} weight="bold" className="text-zinc-950" />
                    </div>
                  )}
                </button>
              );
            })}
      </div>

      {/* Continue button */}
      <div className="flex justify-center mt-8">
        {hasSelection ? (
          <button
            type="button"
            onClick={() => onContinue?.(tiers[selectedIndex], selectedIndex)}
            className="shiny-cta h-11 px-8 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background ring-2 ring-teal-400/45 shadow-[0_0_28px_rgba(0,198,167,0.28)]"
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
        You&#8217;ll choose your payment method and complete checkout in the
        next step.
      </p>
    </div>
  );
}
