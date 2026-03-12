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
import { CheckCircle, ArrowLeft, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  BASE_CHAIN_ID,
  CHAIN_LABEL,
  VANTA_USDC_WALLET,
} from "@/lib/constants";
import { usdcAbi } from "@/lib/usdc-abi";

function formatAccountSize(size) {
  return `$${size.toLocaleString("en-US")}`;
}

function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Payment states: idle | processing | success | error
export function StepPayment({ selectedTier, hlAddress, onPaymentComplete, onBack }) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [paymentState, setPaymentState] = useState("idle"); // idle | processing | success | error
  const [errorMessage, setErrorMessage] = useState("");

  const price = selectedTier.promoPrice;

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: isConnected && chainId === BASE_CHAIN_ID },
  });

  const formattedBalance = balance != null ? formatUnits(balance, USDC_DECIMALS) : null;
  const hasEnough = balance != null && balance >= parseUnits(String(price), USDC_DECIMALS);
  const isOnBase = chainId === BASE_CHAIN_ID;

  const handlePay = useCallback(async () => {
    if (!walletClient || !publicClient) return;

    setPaymentState("processing");
    setErrorMessage("");

    try {
      // TODO: Replace with x402 payment flow when API is confirmed
      // Using direct USDC transfer as fallback — x402 requires a 402 endpoint
      // which is not yet wired. The import structure is preserved for easy swap.
      const amount = parseUnits(String(price), USDC_DECIMALS);

      const txHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: usdcAbi,
        functionName: "transfer",
        args: [VANTA_USDC_WALLET, amount],
        chain: walletClient.chain,
      });

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setPaymentState("success");

      // Auto-advance after 1.5s
      setTimeout(() => {
        onPaymentComplete(txHash);
      }, 1500);
    } catch (err) {
      setPaymentState("error");

      if (err.message?.includes("User rejected") || err.message?.includes("denied")) {
        setErrorMessage("Transaction rejected — you can try again when ready.");
      } else if (err.message?.includes("insufficient") || err.message?.includes("exceeds balance")) {
        setErrorMessage("Insufficient USDC balance for this transaction.");
      } else {
        setErrorMessage(err.shortMessage || err.message || "Payment failed — please try again.");
      }
    }
  }, [walletClient, publicClient, price, onPaymentComplete]);

  return (
    <div className="flex flex-col items-center space-y-8 animate-[fadeInUp_0.35s_ease-out_both]">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Complete your payment
        </h2>
        <p className="text-sm text-muted-foreground">
          Pay with USDC on {CHAIN_LABEL}
        </p>
      </div>

      {/* Order summary card */}
      <div className="w-full max-w-lg rounded-xl border border-border bg-zinc-900/50 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-semibold">
            {selectedTier.name} — {formatAccountSize(selectedTier.accountSize)} Funded Account
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">HL Wallet</span>
          <span className="font-mono text-xs text-foreground">
            {truncateAddress(hlAddress)}
          </span>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Pricing */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Evaluation fee</span>
          <div className="flex items-baseline gap-2">
            <del className="text-xs text-[oklch(0.65_0_0)]">
              <span className="sr-only">Original price: </span>
              ${selectedTier.fullPrice}
            </del>
            <ins className="no-underline">
              <span className="sr-only">Sale price: </span>
              <span className="text-teal-400 font-bold font-mono">
                ${selectedTier.promoPrice}
              </span>
            </ins>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span className="text-xl font-bold font-mono text-teal-400">
            ${price} <span className="text-sm font-semibold text-muted-foreground">USDC</span>
          </span>
        </div>
      </div>

      {/* Payment action area */}
      <div className="w-full max-w-lg space-y-4">
        {/* Status region for screen readers */}
        <div aria-live="polite" className="sr-only">
          {paymentState === "processing" && "Confirming transaction..."}
          {paymentState === "success" && "Payment confirmed"}
        </div>

        {/* Success state */}
        {paymentState === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle size={48} weight="fill" className="text-teal-400" />
            <p className="text-lg font-semibold text-teal-400">
              Payment confirmed
            </p>
          </div>
        )}

        {/* Error state */}
        {paymentState === "error" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Warning size={18} weight="fill" className="text-destructive shrink-0 mt-0.5" />
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            </div>
            <Button
              onClick={() => {
                setPaymentState("idle");
                setErrorMessage("");
              }}
              className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Idle / Processing states */}
        {paymentState !== "success" && paymentState !== "error" && (
          <>
            {!isConnected ? (
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            ) : !isOnBase ? (
              <Button
                onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
                className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
              >
                Switch to {CHAIN_LABEL}
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Connected address */}
                <p className="text-xs text-center text-muted-foreground">
                  Connected: <span className="font-mono text-foreground">{truncateAddress(address)}</span>
                  {formattedBalance != null && (
                    <>
                      {" · "}
                      <span className={hasEnough ? "text-foreground" : "text-destructive"}>
                        {Number(formattedBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                      </span>
                    </>
                  )}
                </p>

                {/* Pay button */}
                <Button
                  onClick={handlePay}
                  disabled={paymentState === "processing" || !hasEnough}
                  aria-label={`Pay ${price} USDC for ${selectedTier.name} evaluation`}
                  className={`
                    w-full h-11 text-sm font-semibold cursor-pointer relative overflow-hidden
                    ${paymentState === "processing"
                      ? "bg-teal-400/60 text-zinc-950"
                      : "bg-teal-400 text-zinc-950 hover:bg-teal-400/90"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed
                  `}
                >
                  {paymentState === "processing" ? (
                    <>
                      <span className="skeleton absolute inset-0 rounded-[inherit]" />
                      <span className="relative">Confirming transaction...</span>
                    </>
                  ) : !hasEnough ? (
                    "Insufficient USDC balance"
                  ) : (
                    `Pay $${price} USDC`
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Back — only in idle state */}
      {paymentState === "idle" && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 h-11 px-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to wallet input
        </button>
      )}
    </div>
  );
}
