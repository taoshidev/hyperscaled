"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWalletClient,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  CheckCircle,
  ArrowLeft,
  Warning,
  Wallet,
  CurrencyDollar,
  GoogleChromeLogo,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import ExtensionModal from "@/components/marketing/ExtensionModal";
import { isValidHLAddress } from "@/lib/validation";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  BASE_CHAIN_ID,
  CHAIN_LABEL,
  CHROME_EXTENSION_URL,
} from "@/lib/constants";
import { usdcAbi } from "@/lib/usdc-abi";
import { formatAccountSize, truncateAddress } from "@/lib/format";
import { useExtensionBridge } from "@/hooks/use-extension-bridge";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} from "@x402/core/http";

function formatRulesSummary(details) {
  return details.map((d) => `${d.value} ${d.label.toLowerCase()}`).join(" · ");
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function StepConnectAndPay({
  selectedTier,
  tierIndex,
  minerSlug,
  paymentWallet,
  email,
  onEmailChange,
  onPaymentComplete,
  onPaymentProcessing,
  onBack,
}) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [paymentState, setPaymentState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hlWallet, setHlWallet] = useState("");
  const [hlWalletTouched, setHlWalletTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [payoutWallet, setPayoutWallet] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null); // null | "base" | "hyperliquid"
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);

  const {
    extensionDetected,
    paymentStatus,
    paymentSenderAddress,
    registrationResult,
    initiatePayment,
    resetPaymentStatus,
  } = useExtensionBridge();

  const price = selectedTier.promoPrice;
  const hlWalletValid = isValidHLAddress(hlWallet);
  const showHlWalletError = hlWalletTouched && hlWallet.length > 0 && !hlWalletValid;
  const emailValid = isValidEmail(email);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;

  const resolvedHlAddress = hlWallet;
  const hlAddressReady = hlWallet.length > 0 && hlWalletValid;
  const resolvedPayoutAddress = payoutWallet.length > 0 ? payoutWallet : hlWallet;

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: BASE_CHAIN_ID,
    query: { enabled: isConnected && chainId === BASE_CHAIN_ID },
  });

  const formattedBalance =
    balance != null ? formatUnits(balance, USDC_DECIMALS) : null;
  const hasEnough =
    balance != null &&
    balance >= parseUnits(String(price), USDC_DECIMALS);
  const isOnBase = chainId === BASE_CHAIN_ID;

  // ── Base chain (x402) payment handler ─────────────────────────────────────
  const handlePayBase = useCallback(async () => {
    if (!walletClient) return;

    setPaymentState("processing");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      const body = {
        minerSlug,
        hlAddress: resolvedHlAddress,
        accountSize: selectedTier.accountSize,
        payoutAddress: resolvedPayoutAddress || address,
        email,
        tierIndex,
      };

      const probeRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (probeRes.status === 409) {
        const data = await probeRes.json().catch(() => ({}));
        throw new Error(data.error || "You are already registered with this miner.");
      }

      if (probeRes.status !== 402) {
        const data = await probeRes.json().catch(() => ({}));
        throw new Error(data.error || "Unexpected response from registration server.");
      }

      const paymentRequiredHeader = probeRes.headers.get("PAYMENT-REQUIRED");
      if (!paymentRequiredHeader) throw new Error("No payment requirements received.");
      const paymentRequired = decodePaymentRequiredHeader(paymentRequiredHeader);
      const requirements = paymentRequired.accepts?.[0];
      if (!requirements) throw new Error("No valid payment requirement in response.");

      const signer = {
        address: walletClient.account.address,
        signTypedData: (args) => walletClient.signTypedData(args),
      };
      const scheme = new ExactEvmScheme(signer);
      const partialPayload = await scheme.createPaymentPayload(
        paymentRequired.x402Version,
        requirements,
      );
      const fullPayload = {
        x402Version: partialPayload.x402Version,
        payload: partialPayload.payload,
        resource: paymentRequired.resource,
        accepted: requirements,
      };

      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "payment-signature": encodePaymentSignatureHeader(fullPayload),
        },
        body: JSON.stringify(body),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        throw new Error(
          data.error || data.message || "Registration failed. Please contact support.",
        );
      }

      const result = await registerRes.json();

      setPaymentState("success");
      onPaymentProcessing?.(false);

      setTimeout(() => {
        onPaymentComplete({
          txHash: result.txHash || "",
          hlAddress: resolvedHlAddress,
          registrationStatus: result.status,
          paymentMethod: "base",
        });
      }, 1500);
    } catch (err) {
      setPaymentState("error");
      onPaymentProcessing?.(false);

      if (
        err.message?.includes("User rejected") ||
        err.message?.includes("denied")
      ) {
        setErrorMessage("Signature rejected — you can try again when ready.");
      } else {
        setErrorMessage(err.message || "Payment failed — please try again.");
      }
    }
  }, [
    walletClient,
    minerSlug,
    selectedTier,
    email,
    tierIndex,
    address,
    resolvedHlAddress,
    resolvedPayoutAddress,
    onPaymentComplete,
    onPaymentProcessing,
  ]);

  // ── Hyperliquid payment handler ───────────────────────────────────────────
  const handlePayHL = useCallback(() => {
    const normalizedParams = {
      destination: paymentWallet?.trim() || "",
      amount: String(price).trim(),
      sender: (paymentSenderAddress || resolvedHlAddress).trim(),
      minerSlug,
      hlAddress: resolvedHlAddress.trim(),
      accountSize: selectedTier.accountSize,
      payoutAddress: resolvedPayoutAddress,
      email,
      tierIndex,
    };

    hlPaymentParamsRef.current = normalizedParams;

    setPaymentState("processing");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    initiatePayment({
      destination: normalizedParams.destination,
      amount: normalizedParams.amount,
      tierName: selectedTier.name,
      hlAddress: normalizedParams.hlAddress,
      payoutAddress: resolvedPayoutAddress,
      email,
      minerSlug,
      accountSize: selectedTier.accountSize,
      tierIndex,
    });
  }, [
    initiatePayment,
    paymentWallet,
    price,
    selectedTier,
    resolvedHlAddress,
    resolvedPayoutAddress,
    email,
    minerSlug,
    tierIndex,
    paymentSenderAddress,
    onPaymentProcessing,
  ]);

  // Store volatile values in refs so the verification watcher stays stable
  const hlPaymentParamsRef = useRef(null);
  const verificationRunRef = useRef(0);
  const callbacksRef = useRef({ onPaymentComplete, onPaymentProcessing });
  callbacksRef.current = { onPaymentComplete, onPaymentProcessing };

  // Extension reports the actual connected sender wallet after form completion.
  // Promote it into live verification params as soon as it arrives.
  useEffect(() => {
    if (!paymentSenderAddress) return;
    if (paymentMethod !== "hyperliquid" || paymentState !== "processing") return;
    if (!hlPaymentParamsRef.current) return;
    hlPaymentParamsRef.current.sender = paymentSenderAddress.trim();
  }, [paymentSenderAddress, paymentMethod, paymentState]);

  useEffect(() => {
    // Start verification watcher as soon as HL payment is processing.
    if (paymentMethod !== "hyperliquid" || paymentState !== "processing") return;
    const params = hlPaymentParamsRef.current;
    if (!params) return;

    const runId = ++verificationRunRef.current;
    let cancelled = false;
    const startedAt = Date.now();
    const timeoutMs = 300000;

    async function verifyAndRegister() {
      let delayMs = 2000;
      let attempt = 0;

      while (!cancelled && verificationRunRef.current === runId) {
        if (Date.now() - startedAt >= timeoutMs) {
          setPaymentState("error");
          setErrorMessage(
            "Payment verification timed out. If you completed the transfer, please contact support."
          );
          callbacksRef.current.onPaymentProcessing?.(false);
          return;
        }

        attempt += 1;

        let data = null;
        let shouldStop = false;

        const qs = new URLSearchParams({
          destination: params.destination.trim(),
          amount: String(params.amount).trim(),
          _ts: String(Date.now()),
        });
        if (params.sender) {
          qs.set("sender", params.sender.trim());
        }

        if (process.env.NODE_ENV === "development") {
          console.debug("[HL verify] attempt", attempt, Object.fromEntries(qs.entries()));
        }

        let res;
        try {
          res = await fetch(`/api/verify-hl-payment?${qs}`, { cache: "no-store" });
        } catch (err) {
          console.error("[HL verify] request error:", err);
        }

        if (res) {
          if (!res.ok) {
            console.warn("[HL verify] non-ok response:", res.status);
            if (res.status >= 400 && res.status < 500) {
              setPaymentState("error");
              setErrorMessage(
                "Could not verify this payment request. Please confirm the wallet and amount, then try again."
              );
              callbacksRef.current.onPaymentProcessing?.(false);
              return;
            }
          } else {
            try {
              data = await res.json();
            } catch (err) {
              console.error("[HL verify] parse error:", err);
            }
          }
        }

        if (process.env.NODE_ENV === "development" && data) {
          console.debug("[HL verify] result:", data);
        }

        if (data?.verified) {
          shouldStop = true;
        }

        if (!shouldStop) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          delayMs = Math.min(Math.floor(delayMs * 1.4), 8000);
          continue;
        }

        if (cancelled || verificationRunRef.current !== runId) return;

        const regRes = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            minerSlug: params.minerSlug,
            hlAddress: params.hlAddress,
            accountSize: params.accountSize,
            payoutAddress: params.payoutAddress,
            email: params.email,
            tierIndex: params.tierIndex,
            paymentMethod: "hyperliquid",
            hlTransferHash: data.txHash,
            hlTransferSender: params.sender,
          }),
        });

        if (regRes.ok || regRes.status === 409) {
          // 409 = background already registered with this tx hash — treat as success
          const result = await regRes.json().catch(() => ({}));
          setPaymentState("success");
          callbacksRef.current.onPaymentProcessing?.(false);
          setTimeout(() => {
            callbacksRef.current.onPaymentComplete({
              txHash: data.txHash || "",
              hlAddress: params.hlAddress,
              registrationStatus: result.status || "registered",
              paymentMethod: "hyperliquid",
            });
          }, 1500);
          return;
        }

        const errData = await regRes.json().catch(() => ({}));
        setPaymentState("error");
        setErrorMessage(errData.error || "Registration failed after payment verification.");
        callbacksRef.current.onPaymentProcessing?.(false);
        return;
      }
    }

    verifyAndRegister();

    return () => {
      cancelled = true;
    };
  }, [paymentMethod, paymentState]);

  // Background registration completed — the extension verified and registered
  // while this tab was throttled or backgrounded. Skip straight to success.
  useEffect(() => {
    if (!registrationResult || !registrationResult.txHash) return;
    if (paymentState !== "processing") return;

    // Cancel the client-side verification loop
    verificationRunRef.current += 1;

    setPaymentState("success");
    callbacksRef.current.onPaymentProcessing?.(false);
    setTimeout(() => {
      callbacksRef.current.onPaymentComplete({
        txHash: registrationResult.txHash,
        hlAddress: registrationResult.hlAddress || hlPaymentParamsRef.current?.hlAddress || "",
        registrationStatus: registrationResult.registrationStatus || "registered",
        paymentMethod: "hyperliquid",
      });
    }, 1500);
  }, [registrationResult, paymentState]);

  const canPayBase =
    isConnected &&
    isOnBase &&
    hasEnough &&
    hlAddressReady &&
    emailValid &&
    !!paymentWallet &&
    paymentState !== "processing";

  const canPayHL =
    extensionDetected &&
    hlAddressReady &&
    emailValid &&
    !!paymentWallet &&
    paymentState !== "processing";

  const missingFieldBase = !emailValid
    ? "Enter your email to continue"
    : !hlAddressReady
      ? "Enter your Hyperliquid wallet to continue"
      : !hasEnough
        ? "Insufficient USDC balance"
        : null;

  const missingFieldHL = !emailValid
    ? "Enter your email to continue"
    : !hlAddressReady
      ? "Enter your Hyperliquid wallet to continue"
      : null;

  // Determine HL payment flow status text
  const hlFlowStatus =
    paymentStatus === "navigating"
      ? "Opening Hyperliquid..."
      : paymentStatus === "wallet_detected"
        ? "Wallet detected — filling payment form..."
        : paymentStatus === "awaiting_confirmation"
          ? "Payment form filled — confirm the transfer on Hyperliquid"
          : paymentStatus === "sent"
            ? "Transfer submitted — verifying receipt..."
            : null;
  
  return (
    <div className="flex flex-col items-center animate-[fadeInUp_0.35s_ease-out_both]">
      {/* Order summary card */}
      <div className="w-full max-w-lg rounded-xl border border-border bg-zinc-900/50 p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-semibold">
            {selectedTier.name} — {formatAccountSize(selectedTier.accountSize)} Funded Account
          </span>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Challenge fee</span>
          <div className="flex items-baseline gap-2">
            <del className="text-xs text-[oklch(0.65_0_0)]">
              <span className="sr-only">Original price: </span>${selectedTier.fullPrice}
            </del>
            <ins className="no-underline">
              <span className="sr-only">Sale price: </span>
              <span className="text-teal-400 font-bold font-mono">${selectedTier.promoPrice}</span>
            </ins>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span className="text-xl font-bold font-mono text-teal-400">
            ${price} <span className="text-sm font-semibold text-muted-foreground">USDC</span>
          </span>
        </div>

        <p className="text-xs text-muted-foreground text-balance">
          {formatRulesSummary(selectedTier.details)}
        </p>
      </div>

      {/* ─── 1. Email address ─── */}
      <div className="w-full max-w-lg mt-6 space-y-1.5">
        <label htmlFor="reg-email" className="text-xs font-medium text-muted-foreground">
          Email address
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          placeholder="you@example.com"
          aria-label="Email address for registration confirmation"
          aria-describedby="email-error"
          aria-invalid={showEmailError ? "true" : undefined}
          className={`
            w-full rounded-xl border bg-card p-4 text-sm
            placeholder:text-muted-foreground/50
            outline-none
            focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            transition-[border-color,box-shadow] duration-200
            ${showEmailError ? "border-destructive" : "border-border hover:border-white/[0.15]"}
          `}
        />
        <div id="email-error" role="alert" className="min-h-[1.25rem]">
          {showEmailError && (
            <p className="text-xs text-destructive">Enter a valid email address.</p>
          )}
        </div>
      </div>

      {/* ─── 2. Hyperliquid Wallet ─── */}
      <div className="w-full max-w-lg space-y-1.5">
        <label htmlFor="hl-wallet" className="text-xs font-medium text-muted-foreground">
          Hyperliquid wallet
        </label>
        <input
          id="hl-wallet"
          type="text"
          value={hlWallet}
          onChange={(e) => setHlWallet(e.target.value)}
          onBlur={() => setHlWalletTouched(true)}
          placeholder="0x..."
          aria-label="Hyperliquid trading wallet address"
          aria-describedby="hl-wallet-error"
          aria-invalid={showHlWalletError ? "true" : undefined}
          className={`
            w-full rounded-xl border bg-card p-4 text-sm font-mono
            placeholder:text-muted-foreground/50
            outline-none
            focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            transition-[border-color,box-shadow] duration-200
            ${showHlWalletError ? "border-destructive" : "border-border hover:border-white/[0.15]"}
          `}
        />
        <div id="hl-wallet-error" role="alert" className="min-h-[1.25rem]">
          {showHlWalletError && (
            <p className="text-xs text-destructive">
              Enter a valid address — 0x followed by 40 hex characters
            </p>
          )}
        </div>
      </div>

      {/* ─── 3. Payout Wallet (optional) ─── */}
      {hlAddressReady && (
        <div className="w-full max-w-lg space-y-1.5">
          <label htmlFor="payout-wallet" className="text-xs font-medium text-muted-foreground">
            Payout wallet <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input
            id="payout-wallet"
            type="text"
            value={payoutWallet}
            onChange={(e) => setPayoutWallet(e.target.value)}
            placeholder={hlWallet || "Defaults to your Hyperliquid address"}
            aria-label="Payout wallet address — defaults to your Hyperliquid address"
            className={`
              w-full rounded-xl border bg-card p-4 text-sm font-mono
              placeholder:text-muted-foreground/50
              outline-none
              focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              transition-[border-color,box-shadow] duration-200
              border-border hover:border-white/[0.15]
            `}
          />
          <p className="text-xs text-muted-foreground/60 min-h-[1.25rem]">
            Defaults to your Hyperliquid address if left blank
          </p>
        </div>
      )}

      {/* ─── 4. Payment Method Selector ─── */}
      <div className="w-full max-w-lg mt-2 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          Payment method
        </p>
        <div
          role="radiogroup"
          aria-label="Select payment method"
          className="grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "base"}
            onClick={() => {
              setPaymentMethod("base");
              resetPaymentStatus();
              if (paymentState === "error") {
                setPaymentState("idle");
                setErrorMessage("");
              }
            }}
            className={`
              rounded-xl border p-4 text-left cursor-pointer transition-[border-color,box-shadow] duration-200
              outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              ${
                paymentMethod === "base"
                  ? "border-teal-400 bg-teal-400/5"
                  : "border-border bg-card hover:border-white/[0.15]"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${paymentMethod === "base" ? "bg-teal-400/15" : "bg-white/[0.05]"}`}>
                <Wallet size={20} weight="duotone" className={paymentMethod === "base" ? "text-teal-400" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Pay with Wallet</p>
                <p className="text-xs text-muted-foreground">USDC on Base</p>
              </div>
            </div>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "hyperliquid"}
            onClick={() => {
              setPaymentMethod("hyperliquid");
              if (paymentState === "error") {
                setPaymentState("idle");
                setErrorMessage("");
              }
            }}
            className={`
              rounded-xl border p-4 text-left cursor-pointer transition-[border-color,box-shadow] duration-200
              outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              ${
                paymentMethod === "hyperliquid"
                  ? "border-teal-400 bg-teal-400/5"
                  : "border-border bg-card hover:border-white/[0.15]"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${paymentMethod === "hyperliquid" ? "bg-teal-400/15" : "bg-white/[0.05]"}`}>
                <CurrencyDollar size={20} weight="duotone" className={paymentMethod === "hyperliquid" ? "text-teal-400" : "text-muted-foreground"} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Pay with Hyperliquid</p>
                <p className="text-xs text-muted-foreground">USDC transfer</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ─── 5. Payment UI ─── */}
      <div className="w-full max-w-lg mt-4 space-y-4">
        {/* Status region for screen readers */}
        <div aria-live="polite" className="sr-only">
          {paymentState === "processing" && "Confirming payment..."}
          {paymentState === "success" && "Payment confirmed"}
        </div>

        {/* Success state (both methods) */}
        {paymentState === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle size={48} weight="fill" className="text-teal-400" />
            <p className="text-lg font-semibold text-teal-400">
              Payment confirmed
            </p>
          </div>
        )}

        {/* Error state (both methods) */}
        {paymentState === "error" && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <Warning
                size={18}
                weight="fill"
                className="text-destructive shrink-0 mt-0.5"
              />
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            </div>
            <Button
              onClick={() => {
                setPaymentState("idle");
                setErrorMessage("");
                resetPaymentStatus();
                hlPaymentParamsRef.current = null;
              }}
              className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
            >
              Try again
            </Button>
          </div>
        )}

        {/* ── Base wallet payment flow ── */}
        {paymentMethod === "base" && paymentState !== "success" && paymentState !== "error" && (
          <>
            {!isConnected ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground text-balance max-w-md mx-auto">
                  Connect the wallet you&#8217;ll use to pay with USDC on&nbsp;Base.
                </p>
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={openConnectModal}
                        className="shiny-cta h-11 px-8 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold">
                          <Wallet size={18} weight="bold" />
                          Connect Wallet
                        </span>
                      </button>
                    </div>
                  )}
                </ConnectButton.Custom>
              </div>
            ) : !isOnBase ? (
              <Button
                onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
                className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
              >
                Switch to {CHAIN_LABEL}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-zinc-900/50 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                    <span className="text-sm font-mono text-foreground">
                      {truncateAddress(address)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Connected
                  </span>
                </div>

                {formattedBalance != null && (
                  <p className="text-xs text-center text-muted-foreground">
                    Balance:{" "}
                    <span
                      className={
                        hasEnough
                          ? "text-foreground font-mono"
                          : "text-destructive font-mono"
                      }
                    >
                      {Number(formattedBalance).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                  </p>
                )}

                <Button
                  onClick={handlePayBase}
                  disabled={!canPayBase}
                  aria-label={`Pay ${price} USDC for ${selectedTier.name} challenge`}
                  className={`
                    w-full h-11 text-sm font-semibold cursor-pointer relative overflow-hidden
                    ${
                      paymentState === "processing"
                        ? "bg-teal-400/60 text-zinc-950"
                        : "bg-teal-400 text-zinc-950 hover:bg-teal-400/90"
                    }
                    disabled:opacity-40 disabled:cursor-not-allowed
                  `}
                >
                  {paymentState === "processing" ? (
                    <>
                      <span className="skeleton absolute inset-0 rounded-[inherit]" />
                      <span className="relative">
                        Confirming payment...
                      </span>
                    </>
                  ) : missingFieldBase ? (
                    missingFieldBase
                  ) : (
                    `Pay $${price} USDC`
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Hyperliquid payment flow ── */}
        {paymentMethod === "hyperliquid" && paymentState !== "success" && paymentState !== "error" && (
          <>
            {!extensionDetected ? (
              /* Extension not installed */
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Chrome extension required
                  </p>
                  <p className="text-sm text-muted-foreground text-balance">
                    The Hyperscaled extension connects to Hyperliquid and fills the payment form for you. Install it to continue with this payment method.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = '/hyperscaled_extension.zip'
                    a.download = 'hyperscaled_extension.zip'
                    a.click()
                    setExtensionModalOpen(true)
                  }}
                  className="shiny-cta h-11 w-full flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <GoogleChromeLogo size={18} weight="bold" />
                    Install Chrome Extension
                  </span>
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  After installing, refresh this page to continue
                </p>
                <ExtensionModal open={extensionModalOpen} onClose={() => setExtensionModalOpen(false)} hideTelegram />
              </div>
            ) : paymentState === "idle" ? (
              /* Extension detected, ready to pay */
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-zinc-900/50 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                    <span className="text-sm text-foreground">
                      Extension detected
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Ready
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-zinc-900/30 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">How it works</p>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>The extension opens Hyperliquid and fills the send form</li>
                    <li>Review the details and confirm the USDC transfer</li>
                    <li>Return here — your registration completes automatically</li>
                  </ol>
                </div>

                <Button
                  onClick={handlePayHL}
                  disabled={!canPayHL}
                  aria-label={`Pay ${price} USDC via Hyperliquid for ${selectedTier.name} challenge`}
                  className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {missingFieldHL || `Pay $${price} USDC via Hyperliquid`}
                </Button>
              </div>
            ) : (
              /* Extension payment in progress */
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-zinc-900/50 p-5 space-y-4">
                  {/* Status indicator */}
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 pulse-teal shrink-0" />
                    <p className="text-sm font-semibold text-foreground">
                      {hlFlowStatus || "Processing..."}
                    </p>
                  </div>

                  {/* Transfer details */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-mono font-semibold text-teal-400">${price} USDC</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">To</span>
                      <span className="font-mono text-foreground">{truncateAddress(paymentWallet)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">From</span>
                      <span className="font-mono text-foreground">{truncateAddress(resolvedHlAddress)}</span>
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <PaymentStep
                      label="Opening Hyperliquid"
                      done={paymentStatus === "wallet_detected" || paymentStatus === "awaiting_confirmation" || paymentStatus === "sent"}
                      active={paymentStatus === "navigating" || paymentStatus === "initiating"}
                    />
                    <PaymentStep
                      label="Filling payment form"
                      done={paymentStatus === "awaiting_confirmation" || paymentStatus === "sent"}
                      active={paymentStatus === "wallet_detected" || paymentStatus === "navigating"}
                    />
                    <PaymentStep
                      label="Waiting for confirmation"
                      done={paymentStatus === "sent"}
                      active={paymentStatus === "awaiting_confirmation"}
                    />
                    <PaymentStep
                      label="Verifying receipt"
                      done={false}
                      active={paymentStatus === "sent"}
                    />
                  </div>
                </div>

                {paymentStatus === "awaiting_confirmation" && (
                  <p className="text-xs text-muted-foreground text-center text-balance">
                    Switch to the Hyperliquid tab to review and confirm the transfer
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Back — visible in idle and error, hidden during processing and success */}
      {(paymentState === "idle" || paymentState === "error") && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 h-11 px-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <ArrowLeft size={14} weight="bold" />
          Back to plan selection
        </button>
      )}

      {/* Dev-only payment bypass */}
      {process.env.NODE_ENV === "development" && (
        <button
          type="button"
          onClick={() =>
            onPaymentComplete({
              txHash: "0xdev123456789abcdef0123456789abcdef01234567",
              hlAddress: "0xdev456789abcdef0123456789abcdef0123456789",
              registrationStatus: "registered",
              paymentMethod: paymentMethod || "base",
            })
          }
          className="mt-2 text-xs text-muted-foreground/50 underline h-11 cursor-pointer"
        >
          Skip payment (dev only)
        </button>
      )}
    </div>
  );
}

/* Small inline component for the HL payment progress steps */
function PaymentStep({ label, done, active }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? (
        <CheckCircle size={16} weight="fill" className="text-teal-400 shrink-0" />
      ) : active ? (
        <span className="w-4 h-4 rounded-full border-2 border-teal-400 shrink-0 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 pulse-teal" />
        </span>
      ) : (
        <span className="w-4 h-4 rounded-full border-2 border-white/10 shrink-0" />
      )}
      <span className={`text-sm ${done ? "text-teal-400" : active ? "text-foreground" : "text-muted-foreground/50"}`}>
        {label}
      </span>
    </div>
  );
}
