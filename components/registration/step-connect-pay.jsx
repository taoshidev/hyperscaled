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
  Info,
  ShieldCheck,
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
  HL_API_URL,
  HL_SIGNING_CHAIN_ID,
  HL_CHAIN_NAME,
} from "@/lib/constants";
import { usdcAbi } from "@/lib/usdc-abi";
import { formatAccountSize, truncateAddress } from "@/lib/format";
import { useExtensionBridge } from "@/hooks/use-extension-bridge";
import { useRegistrationHelp } from "./registration-help-context";
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
  const { switchChain, switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [paymentState, setPaymentState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hlWallet, setHlWallet] = useState("");
  const [hlWalletTouched, setHlWalletTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [payoutWallet, setPayoutWallet] = useState("");
  const [payoutPrefilled, setPayoutPrefilled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("eip712"); // null | "base" | "hyperliquid" | "eip712"
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [hlBalance, setHlBalance] = useState(null);
  const [hlBalanceLoading, setHlBalanceLoading] = useState(false);

  const { handleHelpFocus, handleHelpBlur } = useRegistrationHelp();

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

  // ── Fetch Hyperliquid balance for EIP-712 method ──────────────────────────
  const hlHasEnough = hlBalance != null && hlBalance >= price;
  const walletMatchesHL =
    address && hlWallet && address.toLowerCase() === hlWallet.toLowerCase();

  useEffect(() => {
    if (paymentMethod !== "eip712" || !isConnected || !address) {
      setHlBalance(null);
      return;
    }
    let cancelled = false;
    setHlBalanceLoading(true);

    Promise.all([
      fetch(`${HL_API_URL}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "spotClearinghouseState", user: address }),
      }).then((r) => r.json()),
      fetch(`${HL_API_URL}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clearinghouseState", user: address }),
      }).then((r) => r.json()),
    ])
      .then(([spot, perps]) => {
        if (cancelled) return;
        const usdcEntry = spot?.balances?.find((b) => b.coin === "USDC");
        const spotAvailable =
          usdcEntry
            ? parseFloat(usdcEntry.total) - parseFloat(usdcEntry.hold)
            : 0;
        const perpsWithdrawable =
          perps?.withdrawable != null ? parseFloat(perps.withdrawable) : 0;
        setHlBalance(spotAvailable + perpsWithdrawable);
        setHlBalanceLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setHlBalance(null);
          setHlBalanceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paymentMethod, isConnected, address]);

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

  // ── Hyperliquid EIP-712 payment handler ──────────────────────────────────
  const handlePayEIP712 = useCallback(async () => {
    if (!walletClient) return;

    setPaymentState("processing");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      const amount = String(price);
      const nonce = Date.now();

      // Step 1 — Switch to Arbitrum so the wallet's active chain matches
      // the EIP-712 domain chainId that Hyperliquid requires
      const previousChainId = chainId;
      if (chainId !== HL_SIGNING_CHAIN_ID) {
        await switchChainAsync({ chainId: HL_SIGNING_CHAIN_ID });
      }

      // Step 2 — Sign Hyperliquid sendAsset (USDC) via EIP-712
      // usdSend/spotSend are disabled for unified accounts; sendAsset works.
      let signature;
      try {
        // Re-fetch wallet client after chain switch (wagmi may return a new
        // client instance bound to the now-active chain)
        const { getWalletClient } = await import("wagmi/actions");
        const { wagmiConfig } = await import("@/lib/wagmi");
        const freshClient = await getWalletClient(wagmiConfig, {
          chainId: HL_SIGNING_CHAIN_ID,
        });

        signature = await freshClient.signTypedData({
          domain: {
            name: "HyperliquidSignTransaction",
            version: "1",
            chainId: HL_SIGNING_CHAIN_ID,
            verifyingContract: "0x0000000000000000000000000000000000000000",
          },
          types: {
            "HyperliquidTransaction:SendAsset": [
              { name: "hyperliquidChain", type: "string" },
              { name: "destination", type: "string" },
              { name: "sourceDex", type: "string" },
              { name: "destinationDex", type: "string" },
              { name: "token", type: "string" },
              { name: "amount", type: "string" },
              { name: "fromSubAccount", type: "string" },
              { name: "nonce", type: "uint64" },
            ],
          },
          primaryType: "HyperliquidTransaction:SendAsset",
          message: {
            hyperliquidChain: HL_CHAIN_NAME,
            destination: paymentWallet,
            sourceDex: "spot",
            destinationDex: "spot",
            token: "USDC",
            amount,
            fromSubAccount: "",
            nonce,
          },
        });
      } finally {
        // Step 3 — Switch back to Base regardless of signing outcome
        if (previousChainId && previousChainId !== HL_SIGNING_CHAIN_ID) {
          switchChainAsync({ chainId: previousChainId }).catch(() => {
            // Best-effort switch back; don't block the flow if the user rejects
          });
        }
      }

      // Split signature into r, s, v for Hyperliquid API
      const r = "0x" + signature.slice(2, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      // Step 4 — Submit signed transfer to Hyperliquid exchange API
      const exchangeRes = await fetch(`${HL_API_URL}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: {
            type: "sendAsset",
            signatureChainId: "0x" + HL_SIGNING_CHAIN_ID.toString(16),
            hyperliquidChain: HL_CHAIN_NAME,
            destination: paymentWallet,
            sourceDex: "spot",
            destinationDex: "spot",
            token: "USDC",
            amount,
            fromSubAccount: "",
            nonce,
          },
          nonce,
          signature: { r, s, v },
        }),
      });

      if (!exchangeRes.ok) {
        const data = await exchangeRes.json().catch(() => ({}));
        throw new Error(data.error || data.message || "Hyperliquid transfer failed.");
      }

      const exchangeResult = await exchangeRes.json();

      // HL exchange returns 200 even on failure — check the status field
      if (exchangeResult.status !== "ok") {
        throw new Error(
          typeof exchangeResult.response === "string"
            ? exchangeResult.response
            : "Hyperliquid transfer failed.",
        );
      }

      // usdSend returns {"status":"ok","response":{"type":"default"}} with no
      // hash. Look up the transfer hash from the HL info endpoint.
      let hlHash = "";
      try {
        const infoRes = await fetch(`${HL_API_URL}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "userNonFundingLedgerUpdates",
            user: address,
          }),
        });
        if (infoRes.ok) {
          const updates = await infoRes.json();
          if (Array.isArray(updates)) {
            // Find the most recent USDC send to the payment wallet
            const match = updates.find((u) => {
              const d = u.delta;
              return (
                d &&
                d.type === "send" &&
                d.token === "USDC" &&
                (d.destination || "").toLowerCase() === paymentWallet.toLowerCase() &&
                Math.abs(Number(d.amount || 0) - price) < 0.01 &&
                Date.now() - (u.time || 0) < 2 * 60 * 1000
              );
            });
            if (match) hlHash = match.hash || "";
          }
        }
      } catch (e) {
        console.warn("Failed to look up HL transfer hash:", e.message);
      }

      if (!hlHash) {
        throw new Error("Transfer succeeded but could not retrieve transaction hash. Please contact support.");
      }

      // Step 5 — Register with our backend
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minerSlug,
          hlAddress: resolvedHlAddress,
          accountSize: selectedTier.accountSize,
          payoutAddress: resolvedPayoutAddress || address,
          email,
          tierIndex,
          paymentMethod: "eip712",
          hlTransferHash: hlHash,
          hlTransferSender: address,
        }),
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
          txHash: hlHash || result.txHash || "",
          hlAddress: resolvedHlAddress,
          registrationStatus: result.status,
          paymentMethod: "eip712",
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
    chainId,
    switchChainAsync,
    price,
    paymentWallet,
    resolvedHlAddress,
    resolvedPayoutAddress,
    onPaymentComplete,
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
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const canPayHL =
    extensionDetected &&
    hlAddressReady &&
    emailValid &&
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const canPayEIP712 =
    isConnected &&
    hlHasEnough &&
    hlAddressReady &&
    emailValid &&
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const missingFieldBase = !emailValid
    ? "Enter your email to continue"
    : !hlAddressReady
      ? "Enter your Hyperliquid wallet address to continue"
      : !confirmed
        ? "Confirm your details above to continue"
        : !hasEnough
          ? "Insufficient USDC balance"
          : null;

  const missingFieldHL = !emailValid
    ? "Enter your email to continue"
    : !hlAddressReady
      ? "Enter your Hyperliquid wallet address to continue"
      : !confirmed
        ? "Confirm your details above to continue"
        : null;

  const missingFieldEIP712 = !emailValid
    ? "Enter your email to continue"
    : !hlAddressReady
      ? "Enter your Hyperliquid wallet address to continue"
      : !confirmed
        ? "Confirm your details above to continue"
        : hlBalanceLoading
          ? "Checking Hyperliquid balance..."
          : !hlHasEnough
            ? hlBalance != null
              ? "Insufficient USDC on Hyperliquid"
              : "Could not fetch Hyperliquid balance"
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
          onFocus={() => handleHelpFocus("email")}
          onBlur={() => { setEmailTouched(true); handleHelpBlur(); }}
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
          Hyperliquid wallet address (this is the wallet you will use to trade)
        </label>
        <input
          id="hl-wallet"
          type="text"
          value={hlWallet}
          onChange={(e) => {
            setHlWallet(e.target.value);
            setConfirmed(false);
          }}
          onFocus={() => handleHelpFocus("hl-wallet")}
          onBlur={() => { setHlWalletTouched(true); handleHelpBlur(); }}
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

      {/* ─── 3. Payment Method Selector ─── */}
      <div className="w-full max-w-lg mt-2 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          Payment method
        </p>
        <div
          role="radiogroup"
          aria-label="Select payment method"
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {/* Hyperliquid EIP-712 — default, shiny animated border when selected */}
          <div className={`rounded-xl p-[1.5px] transition-colors duration-200 ${
            paymentMethod === "eip712" ? "hl-shiny-border" : "bg-white/[0.1] hover:bg-white/[0.15]"
          }`}>
            <button
              type="button"
              role="radio"
              aria-checked={paymentMethod === "eip712"}
              onClick={() => {
                setPaymentMethod("eip712");
                handleHelpFocus("payment-eip712");
                setConfirmed(false);
                resetPaymentStatus();
                if (!payoutPrefilled && hlAddressReady) {
                  setPayoutWallet(hlWallet);
                  setPayoutPrefilled(true);
                }
                if (paymentState === "error") {
                  setPaymentState("idle");
                  setErrorMessage("");
                }
              }}
              className="relative w-full rounded-[calc(0.75rem-1.5px)] p-4 text-left cursor-pointer transition-[background-color] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background bg-card"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${paymentMethod === "eip712" ? "bg-teal-400/15" : "bg-white/[0.05]"}`}>
                  <ShieldCheck size={20} weight="duotone" className={paymentMethod === "eip712" ? "text-teal-400" : "text-muted-foreground"} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Sign & Send</p>
                  <p className="text-xs text-muted-foreground">USDC via Hyperliquid Spot</p>
                </div>
              </div>
            </button>
          </div>

          {/* Send via Extension — Hyperliquid extension fills the form */}
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "hyperliquid"}
            onClick={() => {
              setPaymentMethod("hyperliquid");
              handleHelpFocus("payment-hl");
              setConfirmed(false);
              if (!payoutPrefilled && hlAddressReady) {
                setPayoutWallet(hlWallet);
                setPayoutPrefilled(true);
              }
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
                <p className="text-sm font-semibold text-foreground">Send via Extension</p>
                <p className="text-xs text-muted-foreground">USDC via Hyperliquid Spot</p>
              </div>
            </div>
          </button>

          {/* Pay with Wallet — USDC on Base */}
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "base"}
            onClick={() => {
              setPaymentMethod("base");
              handleHelpFocus("payment-base");
              setConfirmed(false);
              resetPaymentStatus();
              if (!payoutPrefilled && hlAddressReady) {
                setPayoutWallet(hlWallet);
                setPayoutPrefilled(true);
              }
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
        </div>
      </div>

      {/* ─── 4. Payout Wallet (shown after payment method selected) ─── */}
      {paymentMethod && hlAddressReady && (
        <div className="w-full max-w-lg mt-4 space-y-1.5">
          <label htmlFor="payout-wallet" className="text-xs font-medium text-muted-foreground">
            Payout wallet <span className="text-muted-foreground/60">(where you receive payouts)</span>
          </label>
          <input
            id="payout-wallet"
            type="text"
            value={payoutWallet}
            onChange={(e) => {
              setPayoutWallet(e.target.value);
              setConfirmed(false);
            }}
            onFocus={() => handleHelpFocus("payout-wallet")}
            onBlur={handleHelpBlur}
            placeholder={hlWallet || "0x..."}
            aria-label="Payout wallet address — where you will receive payouts"
            className={`
              w-full rounded-xl border bg-card p-4 text-sm font-mono
              placeholder:text-muted-foreground/50
              outline-none
              focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              transition-[border-color,box-shadow] duration-200
              border-border hover:border-white/[0.15]
            `}
          />
          <p className="text-xs text-muted-foreground/40 min-h-[1.25rem]">
            Prefilled with your Hyperliquid address — change if you want payouts sent elsewhere
          </p>
        </div>
      )}

      {/* ─── 5. Confirmation Review ─── */}
      {paymentMethod && hlAddressReady && emailValid && paymentState !== "success" && (
        <div className="w-full max-w-lg mt-4 space-y-3">
          <div className="rounded-xl border border-border bg-zinc-900/50 p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Info size={16} weight="fill" className="text-teal-400 shrink-0" />
              <p className="text-sm font-semibold text-foreground">Confirm your details</p>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-muted-foreground">Trading wallet</p>
                  <p className="font-mono text-foreground break-all">{hlWallet}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This address will be tracked for all trades
                  </p>
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-muted-foreground">Payout wallet</p>
                  <p className="font-mono text-foreground break-all">{resolvedPayoutAddress}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    All earned payouts will be sent to this address
                  </p>
                </div>
              </div>

              <div className="border-t border-border" />

              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-muted-foreground">You will receive</p>
                  <p className="text-foreground font-semibold">
                    {selectedTier.name} — {formatAccountSize(selectedTier.accountSize)} Funded Account
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatRulesSummary(selectedTier.details)}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="
                    mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-card
                    accent-teal-400 cursor-pointer
                    focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none
                  "
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-[color] duration-200">
                  I confirm these details are correct and understand that my trading wallet will be tracked and payouts will be sent to the wallet shown above.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. Payment UI ─── */}
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

        {/* ── Hyperliquid EIP-712 payment flow ── */}
        {paymentMethod === "eip712" && paymentState !== "success" && paymentState !== "error" && (
          <>
            {!isConnected ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground text-balance max-w-md mx-auto">
                  Connect the wallet that owns your Hyperliquid account to sign and transfer USDC.
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
                          <ShieldCheck size={18} weight="bold" />
                          Connect Wallet
                        </span>
                      </button>
                    </div>
                  )}
                </ConnectButton.Custom>
              </div>
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

                {/* Wallet mismatch warning */}
                {hlAddressReady && !walletMatchesHL && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-2.5">
                    <Warning size={16} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Connected wallet does not match your Hyperliquid trading address. The transfer will be signed by{" "}
                      <span className="font-mono text-foreground">{truncateAddress(address)}</span>.
                    </p>
                  </div>
                )}

                {/* HL balance */}
                <p className="text-xs text-center text-muted-foreground">
                  {hlBalanceLoading ? (
                    "Checking Hyperliquid balance..."
                  ) : hlBalance != null ? (
                    <>
                      HL Balance:{" "}
                      <span
                        className={
                          hlHasEnough
                            ? "text-foreground font-mono"
                            : "text-destructive font-mono"
                        }
                      >
                        {hlBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USDC
                      </span>
                    </>
                  ) : (
                    <span className="text-destructive">Could not fetch Hyperliquid balance</span>
                  )}
                </p>

                <div className="rounded-xl border border-border bg-zinc-900/30 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">How it works</p>
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Sign a Hyperliquid USDC transfer (EIP-712)</li>
                    <li>The signed transfer is submitted to Hyperliquid</li>
                    <li>Registration completes automatically</li>
                  </ol>
                </div>

                <Button
                  onClick={handlePayEIP712}
                  disabled={!canPayEIP712}
                  aria-label={`Sign and transfer ${price} USDC via Hyperliquid for ${selectedTier.name} challenge`}
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
                        Signing transfer...
                      </span>
                    </>
                  ) : missingFieldEIP712 ? (
                    missingFieldEIP712
                  ) : (
                    `Sign & Transfer $${price} USDC`
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
