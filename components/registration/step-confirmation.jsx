"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CHROME_EXTENSION_URL, BASESCAN_URL } from "@/lib/constants";
import { CheckCircle2, ExternalLink, Download, Loader2, XCircle } from "lucide-react";

const POLL_INTERVAL_MS = 5000;

export function StepConfirmation({ miner, tierIndex, hlAddress, txHash, payerAddress, registrationStatus }) {
  const tier = miner.tiers[tierIndex];
  const baseScanUrl = `${BASESCAN_URL}/tx/${txHash}`;

  const [status, setStatus] = useState(registrationStatus);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (status !== "pending") return;

    async function checkStatus() {
      try {
        const res = await fetch(`/api/registration-status?hl_address=${encodeURIComponent(hlAddress)}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "active") {
          setStatus("registered");
        } else if (data.status === "failed") {
          setStatus("failed");
        }
        // "pending", "not_found", "admin" → keep polling
      } catch {
        // Network error — keep polling
      }
    }

    checkStatus();
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, hlAddress]);

  const isRegistered = status === "registered";
  const isFailed = status === "failed";
  const isPending = !isRegistered && !isFailed;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-3">
        {isRegistered ? (
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        ) : isFailed ? (
          <XCircle className="w-16 h-16 mx-auto text-red-500" />
        ) : (
          <Loader2 className="w-16 h-16 mx-auto animate-spin" style={{ color: miner.color }} />
        )}
        <h2 className="text-2xl font-bold">
          {isRegistered
            ? "Registration Complete"
            : isFailed
              ? "Registration Failed"
              : "Setting Up Your Account"}
        </h2>
        <p className="text-muted-foreground">
          {isRegistered
            ? "Your trading account has been created successfully."
            : isFailed
              ? "Something went wrong creating your account. Please contact support."
              : "Your payment is confirmed. We're setting up your trading account — this usually takes a moment."}
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
            <span className="font-medium flex items-center gap-1.5">
              {isPending && (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: miner.color }} />
                  <span style={{ color: miner.color }}>Setting up...</span>
                </>
              )}
              {isRegistered && (
                <span className="text-green-500">Registered</span>
              )}
              {isFailed && (
                <span className="text-red-500">Failed</span>
              )}
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
        {isRegistered && (
          <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
            <Button
              className="w-full mt-2"
              style={{ backgroundColor: miner.color, color: "#fff" }}
            >
              <Download className="w-4 h-4 mr-2" />
              Get Hyperliquid Chrome Extension
            </Button>
          </a>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        {isPending
          ? "Checking registration status with the validator..."
          : "A confirmation email has been sent to your address. If you don\u2019t see it, check your spam folder."}
      </p>
    </div>
  );
}
