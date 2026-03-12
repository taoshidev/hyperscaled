"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft } from "@phosphor-icons/react";
import { isValidHLAddress } from "@/lib/validation";
import { Button } from "@/components/ui/button";

function formatAccountSize(size) {
  return `$${size.toLocaleString("en-US")}`;
}

export function StepHlAddress({ hlAddress, setHlAddress, selectedTier, onContinue, onBack }) {
  const [touched, setTouched] = useState(false);
  const inputRef = useRef(null);
  const valid = isValidHLAddress(hlAddress);
  const showError = touched && !valid && hlAddress.length > 0;

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col items-center space-y-8 animate-[fadeInUp_0.35s_ease-out_both]">
      {/* Header */}
      <div className="text-center space-y-2 max-w-lg">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Enter your Hyperliquid wallet&nbsp;address
        </h2>
        <p className="text-sm text-muted-foreground text-balance">
          This is the wallet you trade from on Hyperliquid.
          Your evaluation tracks trades from this&nbsp;address.
        </p>
      </div>

      {/* Selected tier summary */}
      {selectedTier && (
        <div className="w-full max-w-lg rounded-xl border border-border bg-zinc-900/50 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{selectedTier.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatAccountSize(selectedTier.accountSize)} funded
            </span>
          </div>
          <span className="text-sm font-bold text-teal-400 font-mono">
            ${selectedTier.promoPrice}
          </span>
        </div>
      )}

      {/* Input */}
      <div className="w-full max-w-lg space-y-2">
        <input
          ref={inputRef}
          type="text"
          value={hlAddress}
          onChange={(e) => setHlAddress(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="0x..."
          aria-label="Hyperliquid wallet address"
          aria-describedby="hl-address-error"
          aria-invalid={showError ? "true" : undefined}
          className={`
            w-full rounded-xl border bg-card p-4 text-lg font-mono
            placeholder:text-muted-foreground/50
            outline-none
            focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            transition-[border-color,box-shadow] duration-200
            ${showError
              ? "border-destructive"
              : "border-border hover:border-white/[0.15]"
            }
          `}
        />
        <div
          id="hl-address-error"
          role="alert"
          className="min-h-[1.25rem]"
        >
          {showError && (
            <p className="text-xs text-destructive">
              Enter a valid address — 0x followed by 40 hex characters
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-lg flex flex-col items-center gap-3">
        <Button
          onClick={onContinue}
          disabled={!valid}
          aria-label="Continue to payment"
          className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Continue
          <ArrowRight size={15} weight="bold" className="ml-1.5" />
        </Button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 h-11 px-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to plan selection
        </button>
      </div>
    </div>
  );
}
