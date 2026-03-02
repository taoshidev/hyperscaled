"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StepSelectTier({ miner, onSelect }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Account</h2>
        <p className="text-muted-foreground">
          Select an account size to trade with {miner.name}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {miner.tiers.map((tier, i) => (
          <Card
            key={tier.label}
            className="relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border-border/50 hover:border-transparent"
            style={{ "--hover-border": miner.color }}
            onClick={() => onSelect(i)}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: miner.color }}
            />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold">{tier.label}</CardTitle>
              <p className="text-sm text-muted-foreground">Account Size</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div>
                <span
                  className="text-4xl font-bold"
                  style={{ color: miner.color }}
                >
                  ${tier.priceUsdc}
                </span>
                <span className="text-muted-foreground ml-1">USDC</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-medium">{tier.profitSplit}%</span>{" "}
                profit split
              </div>
              <Button
                className="w-full cursor-pointer"
                onClick={() => onSelect(i)}
                style={{ backgroundColor: miner.color, color: "#fff" }}
              >
                Select {tier.label}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">
        You&apos;ll connect your wallet to pay with USDC on Base in a later step.
      </p>
    </div>
  );
}
