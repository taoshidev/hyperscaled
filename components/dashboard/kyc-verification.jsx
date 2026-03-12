"use client";

import { useState, useCallback } from "react";
import { ShieldCheck, ShieldAlert, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useKycStatus, useKycToken } from "@/hooks/use-kyc";
import { useQueryClient } from "@tanstack/react-query";
import SumsubWebSdk from "@sumsub/websdk-react";

export function KycVerification({ wallet }) {
  const { data: kyc, isLoading } = useKycStatus(wallet);
  const tokenMutation = useKycToken(wallet);
  const queryClient = useQueryClient();
  const [sdkToken, setSdkToken] = useState(null);
  const [showSdk, setShowSdk] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      const result = await tokenMutation.mutateAsync();
      setSdkToken(result.token);
      setShowSdk(true);
    } catch (err) {
      setError(err.message);
    }
  }, [tokenMutation]);

  const handleTokenExpiration = useCallback(async () => {
    try {
      const result = await tokenMutation.mutateAsync();
      return result.token;
    } catch {
      return null;
    }
  }, [tokenMutation]);

  const handleMessage = useCallback(
    (event) => {
      if (event === "idCheck.onApplicantSubmitted") {
        queryClient.invalidateQueries({ queryKey: ["kyc-status", wallet] });
      }
    },
    [queryClient, wallet],
  );

  const handleError = useCallback((err) => {
    console.error("[KYC SDK Error]", err);
    setError("Verification widget encountered an error. Please try again.");
  }, []);

  if (isLoading || !kyc) return null;

  // Already showing SDK widget
  if (showSdk && sdkToken) {
    return (
      <Card>
        <CardContent className="p-6">
          <SumsubWebSdk
            accessToken={sdkToken}
            expirationHandler={handleTokenExpiration}
            onMessage={handleMessage}
            onError={handleError}
          />
        </CardContent>
      </Card>
    );
  }

  const status = kyc.kycStatus;

  if (status === "approved") {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-500">
              Identity Verified
            </p>
            {kyc.verifiedAt && (
              <p className="text-xs text-muted-foreground">
                Verified on{" "}
                {new Date(kyc.verifiedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "rejected") {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-500">
              Verification Not Approved
            </p>
            <p className="text-xs text-muted-foreground">
              Your identity verification was not approved. You can retry the
              process.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStart}
            disabled={tokenMutation.isPending}
          >
            Retry Verification
          </Button>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-500">
              Verification In Progress
            </p>
            <p className="text-xs text-muted-foreground">
              Your identity verification is being reviewed.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStart}
            disabled={tokenMutation.isPending}
          >
            Continue Verification
          </Button>
          {error && (
            <p className="text-xs text-red-500 mt-1">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // status === "none"
  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardContent className="p-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-blue-500 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            Identity Verification Required for Payouts
          </p>
          <p className="text-xs text-muted-foreground">
            Complete identity verification to enable withdrawals and payouts.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStart}
          disabled={tokenMutation.isPending}
        >
          Start Verification
        </Button>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
