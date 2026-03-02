"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidEmail } from "@/lib/validation";

export function StepEmail({ miner, value, onChange, onNext, onBack }) {
  const [touched, setTouched] = useState(false);
  const valid = isValidEmail(value);
  const showError = touched && !valid && value.length > 0;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Email Address</h2>
        <p className="text-muted-foreground">
          We&apos;ll send your registration status and account details here
        </p>
      </div>
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="trader@example.com"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          className={showError ? "border-destructive" : ""}
        />
        {showError && (
          <p className="text-sm text-destructive">
            Enter a valid email address
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
