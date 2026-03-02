"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CHROME_EXTENSION_URL, BASESCAN_URL } from "@/lib/constants";
import { CheckCircle2, Clock, ExternalLink, Download } from "lucide-react";

export function StepConfirmation({ miner, tierIndex, hlAddress, txHash, payerAddress, registrationStatus, registrationMessage }) {
  const tier = miner.tiers[tierIndex];
  const isRegistered = registrationStatus === "registered";
  const baseScanUrl = `${BASESCAN_URL}/tx/${txHash}`;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-3">
        {isRegistered ? (
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        ) : (
          <Clock className="w-16 h-16 mx-auto text-yellow-500" />
        )}
        <h2 className="text-2xl font-bold">
          {isRegistered ? "Registration Complete" : "Registration Pending"}
        </h2>
        <p className="text-muted-foreground">
          {isRegistered
            ? "Your trading account has been created successfully."
            : registrationMessage || "Your payment is confirmed. Account setup is in progress — check your email for updates."}
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Firm</span>
            <span className="font-medium">{miner.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account</span>
            <span className="font-medium">{tier.label}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">HL Wallet</span>
            <span className="font-mono text-xs">{hlAddress.slice(0, 6)}...{hlAddress.slice(-4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payout Wallet</span>
            <span className="font-mono text-xs">{payerAddress.slice(0, 6)}...{payerAddress.slice(-4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span
              className="font-medium"
              style={{ color: isRegistered ? "#22c55e" : "#eab308" }}
            >
              {isRegistered ? "Registered" : "Pending"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <a href={baseScanUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full">
            View Transaction on BaseScan
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </a>
        <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
          <Button
            className="w-full mt-2"
            style={{ backgroundColor: miner.color, color: "#fff" }}
          >
            <Download className="w-4 h-4 mr-2" />
            Get Hyperliquid Chrome Extension
          </Button>
        </a>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        A confirmation email has been sent to your address. If you don&apos;t see it, check your spam folder.
      </p>
    </div>
  );
}
