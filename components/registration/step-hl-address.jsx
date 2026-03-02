"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidHLAddress } from "@/lib/validation";

export function StepHLAddress({ miner, value, onChange, onNext, onBack }) {
  const [touched, setTouched] = useState(false);
  const valid = isValidHLAddress(value);
  const showError = touched && !valid && value.length > 0;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Hyperliquid Wallet</h2>
        <p className="text-muted-foreground">
          Enter the Hyperliquid wallet address for your trading account
        </p>
      </div>
      <div className="space-y-2">
        <Input
          placeholder="0x..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={showError ? "border-destructive" : ""}
        />
        {showError && (
          <p className="text-sm text-destructive">
            Enter a valid address (0x followed by 40 hex characters)
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!valid}
          className="flex-1"
          style={{ backgroundColor: valid ? miner.color : undefined, color: valid ? "#fff" : undefined }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
