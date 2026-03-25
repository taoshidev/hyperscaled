"use client";

import { useState, useCallback } from "react";
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
  CaretDown,
  Wallet,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { isValidHLAddress } from "@/lib/validation";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  BASE_CHAIN_ID,
  CHAIN_LABEL
} from "@/lib/constants";
import { usdcAbi } from "@/lib/usdc-abi";
import { formatAccountSize, truncateAddress } from "@/lib/format";
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
  const [showAltWallet, setShowAltWallet] = useState(false);
  const [altAddress, setAltAddress] = useState("");
  const [altTouched, setAltTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const price = selectedTier.promoPrice;
  const altValid = isValidHLAddress(altAddress);
  const showAltError = altTouched && altAddress.length > 0 && !altValid;
  const emailValid = isValidEmail(email);
  const showEmailError = emailTouched && email.length > 0 && !emailValid;

  // The HL address is the alt address if provided, otherwise the connected wallet
  const resolvedHlAddress =
    showAltWallet && altAddress.length > 0 ? altAddress : address;

  // Can only pay if we have a valid HL address
  const hlAddressReady =
    !showAltWallet || altAddress.length === 0 || altValid;

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

  const handlePay = useCallback(async () => {
    if (!walletClient) return;

    setPaymentState("processing");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      const body = {
        minerSlug,
        hlAddress: resolvedHlAddress,
        accountSize: selectedTier.accountSize,
        payoutAddress: address,
        email,
        tierIndex,
      };

      // Step 1: Initial POST — get payment requirements (expect 402)
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

      // Step 2: Parse payment requirements from 402
      const paymentRequiredHeader = probeRes.headers.get("PAYMENT-REQUIRED");
      if (!paymentRequiredHeader) throw new Error("No payment requirements received.");
      const paymentRequired = decodePaymentRequiredHeader(paymentRequiredHeader);
      const requirements = paymentRequired.accepts?.[0];
      if (!requirements) throw new Error("No valid payment requirement in response.");

      // Step 3: Sign EIP-3009 authorization (no on-chain tx from user)
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

      // Step 4: Re-POST with signed payment header
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
    onPaymentComplete,
    onPaymentProcessing,
  ]);

  const canPay =
    isConnected &&
    isOnBase &&
    hasEnough &&
    hlAddressReady &&
    emailValid &&
    !!paymentWallet &&
    paymentState !== "processing";

  return (
    <div className="flex flex-col items-center animate-[fadeInUp_0.35s_ease-out_both]">
      {/* Order summary card */}
      <div className="w-full max-w-lg rounded-xl border border-border bg-zinc-900/50 p-5 space-y-3">
        {/* Plan row */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-semibold">
            {selectedTier.name} — {formatAccountSize(selectedTier.accountSize)} Funded Account
          </span>
        </div>

        <div className="border-t border-border" />

        {/* Challenge fee row */}
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

        {/* Total row */}
        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span className="text-xl font-bold font-mono text-teal-400">
            ${price} <span className="text-sm font-semibold text-muted-foreground">USDC</span>
          </span>
        </div>

        {/* Rules summary */}
        <p className="text-xs text-muted-foreground text-balance">
          {formatRulesSummary(selectedTier.details)}
        </p>
      </div>

      {/* Email input — always visible */}
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

      {/* Wallet connection section */}
      <div className="w-full max-w-lg space-y-4 mt-4">
        {/* Status region for screen readers */}
        <div aria-live="polite" className="sr-only">
          {paymentState === "processing" && "Confirming payment..."}
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
              }}
              className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
            >
              Try again
            </Button>
          </div>
        )}

        {/* Idle / Processing — wallet + pay */}
        {paymentState !== "success" && paymentState !== "error" && (
          <>
            {!isConnected ? (
              /* Not connected */
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight">
                    Connect your wallet to pay
                  </h3>
                  <p className="text-sm text-muted-foreground text-balance max-w-md mx-auto">
                    You&#8217;ll sign a gasless USDC authorization on Base. Your
                    connected wallet will also be registered as your Hyperliquid
                    trading&nbsp;address.
                  </p>
                </div>
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
              /* Wrong chain */
              <Button
                onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
                className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
              >
                Switch to {CHAIN_LABEL}
              </Button>
            ) : (
              /* Connected + correct chain */
              <div className="space-y-4">
                {/* Connected wallet display */}
                <div className="rounded-xl border border-border bg-zinc-900/50 px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                    <span className="text-sm font-mono text-foreground">
                      {truncateAddress(address)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Trading &amp; payment wallet
                  </span>
                </div>

                {/* Balance display */}
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

                {/* Pay button */}
                <Button
                  onClick={handlePay}
                  disabled={!canPay}
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
                  ) : !hasEnough ? (
                    "Insufficient USDC balance"
                  ) : !emailValid ? (
                    "Enter your email to continue"
                  ) : (
                    `Pay $${price} USDC`
                  )}
                </Button>
              </div>
            )}

            {/* Different wallet toggle — shown when connected or not */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAltWallet((prev) => !prev)}
                aria-expanded={showAltWallet}
                aria-controls="alt-wallet-input"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-[color] duration-200 h-11 px-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg mx-auto w-full justify-center"
              >
                Trading from a different Hyperliquid wallet?
                <CaretDown
                  size={12}
                  weight="bold"
                  className={`transition-transform duration-200 ${showAltWallet ? "rotate-180" : ""}`}
                />
              </button>

              {showAltWallet && (
                <div id="alt-wallet-input" className="space-y-2">
                  <label
                    htmlFor="alt-hl-address"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Hyperliquid trading address
                  </label>
                  <input
                    id="alt-hl-address"
                    type="text"
                    value={altAddress}
                    onChange={(e) => setAltAddress(e.target.value)}
                    onBlur={() => setAltTouched(true)}
                    placeholder="0x..."
                    aria-label="Hyperliquid trading wallet address"
                    aria-describedby="alt-address-error"
                    aria-invalid={showAltError ? "true" : undefined}
                    className={`
                      w-full rounded-xl border bg-card p-4 text-sm font-mono
                      placeholder:text-muted-foreground/50
                      outline-none
                      focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      transition-[border-color,box-shadow] duration-200
                      ${
                        showAltError
                          ? "border-destructive"
                          : "border-border hover:border-white/[0.15]"
                      }
                    `}
                  />
                  <div
                    id="alt-address-error"
                    role="alert"
                    className="min-h-[1.25rem]"
                  >
                    {showAltError && (
                      <p className="text-xs text-destructive">
                        Enter a valid address — 0x followed by 40 hex characters
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
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
