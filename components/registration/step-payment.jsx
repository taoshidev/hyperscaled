"use client";

import { useState, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWalletClient,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { toClientEvmSigner } from "@x402/evm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { USDC_ADDRESS, USDC_DECIMALS, BASE_CHAIN_ID, BASE_NETWORK, CHAIN_LABEL } from "@/lib/constants";
import { usdcAbi } from "@/lib/usdc-abi";
import { Loader2, AlertTriangle } from "lucide-react";
import { reportCritical, reportError } from "@/lib/errors";

export function StepPayment({ miner, minerWallet, tierIndex, hlAddress, email, onComplete, onBack }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [error, setError] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [status, setStatus] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const tier = miner.tiers[tierIndex];
  const price = tier.priceUsdc;

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: isConnected && chainId === BASE_CHAIN_ID },
  });

  const handlePay = useCallback(async () => {
    if (!walletClient || !publicClient) {
      console.warn("[REGISTRATION][StepPayment] handlePay aborted — missing client", {
        hasWalletClient: Boolean(walletClient),
        hasPublicClient: Boolean(publicClient),
      });
      return;
    }

    console.info("[REGISTRATION][StepPayment] handlePay start", {
      minerSlug: miner.slug,
      hlAddress,
      tierIndex,
      price: tier.priceUsdc,
      payer: address,
    });

    setError(null);
    setIsPaying(true);
    setStatus("Requesting payment details...");

    try {
      const affiliateUtm = document.cookie
        .split("; ")
        .find((c) => c.startsWith("hs_affiliate="))
        ?.split("=")[1] || null;

      // Call tolt.signup() now so we have a customer_id before the server
      // records the transaction. Guard against double-calls on retry.
      let toltCustomerId = window.tolt_data?.customer_id || null;
      if (!toltCustomerId && window.tolt) {
        try {
          const result = await window.tolt.signup(hlAddress);
          toltCustomerId = result?.customer_id || window.tolt_data?.customer_id || null;
        } catch { /* tolt unavailable */ }
      }

      const registrationData = {
        minerSlug: miner.slug,
        hlAddress,
        accountSize: tier.accountSize,
        payoutAddress: address,
        email,
        tierIndex,
        affiliateUtm,
        toltCustomerId,
      };

      console.info("[REGISTRATION][StepPayment] probing /api/register for 402", { affiliateUtm });
      const initialRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      console.info("[REGISTRATION][StepPayment] probe response", { status: initialRes.status });

      if (initialRes.status !== 402) {
        const data = await initialRes.json();
        const err = new Error(data.error || "Unexpected response from server");
        reportError(err, {
          source: "registration/step-payment",
          userId: address,
          metadata: {
            step: "probe_unexpected_status",
            httpStatus: initialRes.status,
            serverError: data.error,
            minerSlug: miner.slug,
            hlAddress,
            tierIndex,
          },
        });
        throw err;
      }

      setStatus("Waiting for wallet signature...");

      const signerAdapter = {
        address: walletClient.account.address,
        signTypedData: (args) => walletClient.signTypedData(args),
        readContract: (args) => publicClient.readContract(args),
      };

      const evmSigner = toClientEvmSigner(signerAdapter, publicClient);
      const evmScheme = new ExactEvmScheme(evmSigner);
      const coreClient = new x402Client().register(BASE_NETWORK, evmScheme);
      const httpClient = new x402HTTPClient(coreClient);

      const paymentRequired = httpClient.getPaymentRequiredResponse(
        (name) => initialRes.headers.get(name),
        await initialRes.clone().json(),
      );

      const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);
      const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
      console.info("[REGISTRATION][StepPayment] payment signature created");

      setStatus("Processing payment...");

      const paidRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...paymentHeaders,
        },
        body: JSON.stringify(registrationData),
      });
      console.info("[REGISTRATION][StepPayment] paid request response", {
        status: paidRes.status,
        ok: paidRes.ok,
      });

      const result = await paidRes.json();

      if (!paidRes.ok) {
        const err = new Error(result.error || result.message || "Payment failed");
        // Money-losing state — user signed and we failed to register.
        reportCritical(err, {
          source: "registration/step-payment",
          userId: address,
          metadata: {
            step: "register_after_payment",
            httpStatus: paidRes.status,
            serverError: result.error,
            serverMessage: result.message,
            serverTxHash: result.txHash,
            minerSlug: miner.slug,
            hlAddress,
            tierIndex,
          },
        });
        throw err;
      }

      console.info("[REGISTRATION][StepPayment] registration succeeded", {
        status: result.status,
        txHash: result.txHash,
      });
      onComplete({
        txHash: result.txHash || "",
        payerAddress: address,
        registrationStatus: result.status || "pending",
        registrationMessage: result.message || "",
      });
    } catch (err) {
      console.error("[REGISTRATION][StepPayment] handlePay failed", { error: err?.message });
      setIsPaying(false);
      setStatus(null);
      if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
        setError("Signature rejected. Try again when ready.");
      } else {
        setError(err.message || "Payment failed");
      }
    }
  }, [walletClient, publicClient, miner, tierIndex, hlAddress, email, address, tier, onComplete]);

  const formattedBalance = balance != null ? formatUnits(balance, USDC_DECIMALS) : null;
  const hasEnough = balance != null && balance >= parseUnits(String(price), USDC_DECIMALS);
  const isOnBase = chainId === BASE_CHAIN_ID;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">x402 Payment</h2>
        <p className="text-muted-foreground">
          Pay with USDC on {CHAIN_LABEL}
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
          <div className="border-t border-border my-2" />
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg" style={{ color: miner.color }}>
              ${price} USDC
            </span>
          </div>
        </CardContent>
      </Card>

      {!isConnected ? (
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      ) : !isOnBase ? (
        <Button
          className="w-full"
          onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
          style={{ backgroundColor: miner.color, color: "#fff" }}
        >
          Switch to {CHAIN_LABEL}
        </Button>
      ) : (
        <div className="space-y-3">
          {formattedBalance != null && (
            <p className="text-sm text-center text-muted-foreground">
              Balance:{" "}
              <span className={hasEnough ? "text-foreground" : "text-destructive"}>
                {Number(formattedBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </span>
            </p>
          )}
          <Button
            className="w-full"
            onClick={() => setShowConfirm(true)}
            disabled={isPaying || !hasEnough}
            style={{ backgroundColor: miner.color, color: "#fff" }}
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {status || "Processing..."}
              </>
            ) : !hasEnough ? (
              "Insufficient USDC balance"
            ) : (
              `Pay $${price} USDC`
            )}
          </Button>
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Payment
            </DialogTitle>
            <DialogDescription>
              You are about to send <strong>${price} USDC</strong> to the following address:
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md bg-muted p-3">
            <p className="font-mono text-xs break-all text-center">{minerWallet}</p>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Please verify this address before continuing. This action cannot be undone.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowConfirm(false);
                handlePay();
              }}
              style={{ backgroundColor: miner.color, color: "#fff" }}
            >
              Confirm &amp; Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <div className="flex justify-center">
        <Button variant="ghost" onClick={onBack} disabled={isPaying}>
          Back
        </Button>
      </div>
    </div>
  );
}
