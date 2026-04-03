"use client";

import { useState, useCallback, useEffect } from "react";
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
  ArrowRight,
  Warning,
  Wallet,
  Info,
  ShieldCheck,
  PencilSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
import { ExactEvmScheme } from "@x402/evm/exact/client";
import {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} from "@x402/core/http";

function formatRulesSummary(details) {
  return details.map((d) => `${d.value} ${d.label.toLowerCase()}`).join(" · ");
}

export function StepConnectAndPay({
  selectedTier,
  tierIndex,
  minerSlug,
  paymentWallet,
  onPaymentComplete,
  onPaymentProcessing,
  onBack,
  onContinueToConfirm,
  phase = "connect",
}) {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [paymentState, setPaymentState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hlWallet, setHlWallet] = useState("");
  const [hlWalletTouched, setHlWalletTouched] = useState(false);
  const [payoutWallet, setPayoutWallet] = useState("");
  const [payoutPrefilled, setPayoutPrefilled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("eip712"); // null | "base" | "hyperliquid" | "eip712"
  const [confirmed, setConfirmed] = useState(false);
  const [editingPayout, setEditingPayout] = useState(false);
  const [editPayoutValue, setEditPayoutValue] = useState("");
  const [editingHlWallet, setEditingHlWallet] = useState(true);
  const [hlBalance, setHlBalance] = useState(null);
  const [hlBalanceLoading, setHlBalanceLoading] = useState(false);
  const [eip712Step, setEip712Step] = useState(null); // "signing" | "submitting" | "verifying" | "provisioning"

  const {
    resetPaymentStatus,
  } = useExtensionBridge();

  const price = selectedTier.promoPrice;
  const hlWalletValid = isValidHLAddress(hlWallet);
  const showHlWalletError = hlWalletTouched && hlWallet.length > 0 && !hlWalletValid;

  const resolvedHlAddress = hlWallet;
  const hlAddressReady = hlWallet.length > 0 && hlWalletValid;
  const resolvedPayoutAddress = payoutWallet.length > 0 ? payoutWallet : hlWallet;
  const editPayoutValid = /^0x[a-fA-F0-9]{40}$/.test(editPayoutValue);
  const payoutMatchesTrading = resolvedPayoutAddress.toLowerCase() === hlWallet.toLowerCase();

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

  // ── Auto-fill HL wallet address when wallet connects ──────────────────────
  useEffect(() => {
    if (isConnected && address && !hlWallet) {
      setHlWallet(address);
      setHlWalletTouched(true);
      setEditingHlWallet(false);
    }
  }, [isConnected, address]); // eslint-disable-line react-hooks/exhaustive-deps

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
    tierIndex,
    address,
    resolvedHlAddress,
    resolvedPayoutAddress,
    onPaymentComplete,
    onPaymentProcessing,
  ]);

  // ── Hyperliquid EIP-712 usdSend payment handler ──────────────────────────
  const handlePayEIP712 = useCallback(async () => {
    if (!walletClient) return;

    setPaymentState("processing");
    setEip712Step("signing");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      const amount = String(price);
      const nonce = Date.now();

      // Step 1 — Switch to Arbitrum so the wallet's active chain matches
      // the EIP-712 domain chainId that Hyperliquid requires
      setEip712Step("signing");
      const previousChainId = chainId;
      if (chainId !== HL_SIGNING_CHAIN_ID) {
        await switchChainAsync({ chainId: HL_SIGNING_CHAIN_ID });
      }

      // Step 2 — Sign Hyperliquid sendAsset (USDC) via EIP-712
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
      setEip712Step("submitting");
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

      // Step 5 — Look up the transfer hash from HL info endpoint
      setEip712Step("verifying");
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

      // Step 6 — Register with our backend
      setEip712Step("provisioning");
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minerSlug,
          hlAddress: resolvedHlAddress,
          accountSize: selectedTier.accountSize,
          payoutAddress: resolvedPayoutAddress || address,
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
      setEip712Step(null);
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
      setEip712Step(null);
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

  const canPayBase =
    isConnected &&
    isOnBase &&
    hasEnough &&
    hlAddressReady &&
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const canPayEIP712 =
    isConnected &&
    hlHasEnough &&
    hlAddressReady &&
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const missingFieldBase = !hlAddressReady
    ? "Enter your Hyperliquid wallet address to continue"
    : !confirmed
      ? "Confirm your details above to continue"
      : !hasEnough
        ? "Insufficient USDC balance"
        : null;

  const missingFieldEIP712 = !hlAddressReady
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

  // ── Confirm phase: "Continue to review" readiness ──────────────────────────
  const canContinueToConfirm =
    hlAddressReady &&
    paymentMethod &&
    (paymentMethod === "base"
      ? isConnected && isOnBase
      : isConnected);

  if (phase === "confirm") {
    return (
      <div className="flex flex-col items-center animate-[fadeInUp_0.35s_ease-out_both]">
        {/* ─── Review Card ─── */}
        <div className="w-full max-w-lg rounded-xl border border-border bg-zinc-900/50 p-5 space-y-4">
          {/* Trading wallet — read-only */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Trading wallet</p>
            <p className="text-xs font-mono text-foreground break-all">{hlWallet}</p>
          </div>

          <div className="border-t border-border" />

          {/* Payout wallet — read-only with inline Edit */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Payout wallet</p>
              {!editingPayout && (
                <button
                  type="button"
                  onClick={() => {
                    setEditPayoutValue(resolvedPayoutAddress);
                    setEditingPayout(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-[color] duration-200 h-11 px-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                >
                  <PencilSimple size={12} weight="bold" />
                  Edit
                </button>
              )}
            </div>

            {editingPayout ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editPayoutValue}
                  onChange={(e) => setEditPayoutValue(e.target.value)}
                  placeholder="0x..."
                  aria-label="Payout wallet address"
                  aria-describedby="payout-edit-error"
                  aria-invalid={editPayoutValue.length > 0 && !editPayoutValid ? "true" : undefined}
                  className={`
                    w-full rounded-xl border bg-card p-4 text-sm font-mono
                    placeholder:text-muted-foreground/50
                    outline-none
                    focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    transition-[border-color,box-shadow] duration-200
                    ${editPayoutValue.length > 0 && !editPayoutValid ? "border-destructive" : "border-border hover:border-white/[0.15]"}
                  `}
                />
                {editPayoutValue.length > 0 && !editPayoutValid && (
                  <p id="payout-edit-error" role="alert" className="text-xs text-destructive">
                    Invalid address format
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    disabled={!editPayoutValid}
                    onClick={() => {
                      setPayoutWallet(editPayoutValue);
                      setEditingPayout(false);
                      setConfirmed(false);
                    }}
                    className="h-11 px-6 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingPayout(false)}
                    className="h-11 px-6 text-sm font-semibold border-border text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs font-mono text-foreground break-all">{resolvedPayoutAddress}</p>
            )}

            <p className="text-xs text-muted-foreground/60">
              {payoutMatchesTrading
                ? "Same as trading wallet (default)"
                : <span className="text-teal-400">Custom payout address set</span>
              }
            </p>
            <p className="text-xs text-muted-foreground/40">
              You can also change this later in your dashboard
            </p>
          </div>

          <div className="border-t border-border" />

          {/* Plan summary */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Plan</p>
            <p className="text-sm font-semibold text-foreground">
              {selectedTier.name} — {formatAccountSize(selectedTier.accountSize)} Funded Account
            </p>
            <p className="text-xs text-muted-foreground">
              {formatRulesSummary(selectedTier.details)}
            </p>
          </div>

          <div className="border-t border-border" />

          {/* Checkbox */}
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

        {/* ─── Payment UI ─── */}
        <div className="w-full max-w-lg mt-4 space-y-4">
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
                  setEip712Step(null);
                  setErrorMessage("");
                  resetPaymentStatus();
                }}
                className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
              >
                Try again
              </Button>
            </div>
          )}

          {/* ── Base wallet payment flow ── */}
          {paymentMethod === "base" && paymentState !== "success" && paymentState !== "error" && (
            <div className="space-y-4">
              {formattedBalance != null && (
                <p className="text-xs text-center text-muted-foreground">
                  Balance:{" "}
                  <span className={hasEnough ? "text-foreground font-mono" : "text-destructive font-mono"}>
                    {Number(formattedBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
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
                  <span className="relative">Confirming payment...</span>
                </>
              ) : missingFieldBase ? (
                missingFieldBase
              ) : (
                `Pay $${price} USDC`
              )}
            </Button>
            </div>
          )}

          {/* ── Hyperliquid EIP-712 payment flow ── */}
          {paymentMethod === "eip712" && paymentState !== "success" && paymentState !== "error" && (
            <div className="space-y-4">
              {/* Wallet mismatch warning */}
              {hlAddressReady && !walletMatchesHL && paymentState === "idle" && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-2.5">
                  <Warning size={16} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Connected wallet does not match your Hyperliquid trading address. The transfer will be signed by{" "}
                    <span className="font-mono text-foreground">{truncateAddress(address)}</span>.
                  </p>
                </div>
              )}

              {paymentState === "idle" && (
                <>
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

                  <Button
                    onClick={handlePayEIP712}
                    disabled={!canPayEIP712}
                    aria-label={`Sign and transfer ${price} USDC via Hyperliquid for ${selectedTier.name} challenge`}
                    className="w-full h-11 text-sm font-semibold cursor-pointer bg-teal-400 text-zinc-950 hover:bg-teal-400/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {missingFieldEIP712 || `Pay $${price} USDC`}
                  </Button>
                </>
              )}

              {/* Inline progress steps during EIP-712 signing + submission */}
              {paymentState === "processing" && (
                <div className="rounded-xl border border-border bg-zinc-900/50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 pulse-teal shrink-0" />
                    <p className="text-sm font-semibold text-foreground">
                      {eip712Step === "signing" && "Signing transaction\u2026"}
                      {eip712Step === "submitting" && "Submitting to Hyperliquid L1\u2026"}
                      {eip712Step === "verifying" && "Verifying receipt\u2026"}
                      {eip712Step === "provisioning" && "Provisioning account\u2026"}
                    </p>
                  </div>
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
                      <span className="font-mono text-foreground">{truncateAddress(address)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-border">
                    <PaymentStep
                      label="Signing transaction"
                      done={eip712Step !== "signing"}
                      active={eip712Step === "signing"}
                    />
                    <PaymentStep
                      label="Submitting to Hyperliquid L1"
                      done={eip712Step === "verifying" || eip712Step === "provisioning"}
                      active={eip712Step === "submitting"}
                    />
                    <PaymentStep
                      label="Verifying receipt"
                      done={eip712Step === "provisioning"}
                      active={eip712Step === "verifying"}
                    />
                    <PaymentStep
                      label="Provisioning account"
                      done={false}
                      active={eip712Step === "provisioning"}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Back to Connect & Pay */}
        {(paymentState === "idle" || paymentState === "error") && (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 h-11 px-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
          >
            <ArrowLeft size={14} weight="bold" />
            Back
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

  // ── Connect phase (default) ─────────────────────────────────────────────────
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

      {/* ─── 1. Hyperliquid Wallet ─── */}
      <div className="w-full max-w-lg mt-6 space-y-1.5">
        <label htmlFor="hl-wallet" className="text-xs font-medium text-muted-foreground">
          Hyperliquid wallet address (the wallet you trade with)
        </label>

        {/* Display mode: valid address, not editing */}
        {hlWalletValid && !editingHlWallet ? (
          <div className="flex gap-2">
            <div className="flex-1 rounded-xl border border-border bg-card p-4 text-sm font-mono text-foreground">
              {truncateAddress(hlWallet)}
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingHlWallet(true);
                setHlWallet("");
                setHlWalletTouched(false);
                setConfirmed(false);
              }}
              className="shrink-0 h-[52px] px-4 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-[border-color,color] duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="hl-wallet"
              type="text"
              value={hlWallet}
              onChange={(e) => {
                setHlWallet(e.target.value);
                setConfirmed(false);
              }}
              onBlur={() => {
                setHlWalletTouched(true);
                if (hlWalletValid) setEditingHlWallet(false);
              }}
              placeholder="0x..."
              aria-label="Hyperliquid trading wallet address"
              aria-describedby="hl-wallet-hint hl-wallet-error"
              aria-invalid={showHlWalletError ? "true" : undefined}
              className={`
                flex-1 rounded-xl border bg-card p-4 text-sm font-mono
                placeholder:text-muted-foreground/50
                outline-none
                focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
                transition-[border-color,box-shadow] duration-200
                ${showHlWalletError ? "border-destructive" : "border-border hover:border-white/[0.15]"}
              `}
            />
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="shrink-0 h-[52px] px-4 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-[border-color,color] duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center gap-2"
                  >
                    <Wallet size={16} weight="bold" />
                    Connect wallet
                  </button>
                )}
              </ConnectButton.Custom>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setHlWallet(address);
                  setHlWalletTouched(true);
                  setConfirmed(false);
                  setEditingHlWallet(false);
                }}
                className="shrink-0 h-[52px] px-4 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-[border-color,color] duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background inline-flex items-center gap-2"
              >
                <Wallet size={16} weight="bold" />
                Use connected
              </button>
            )}
          </div>
        )}

        <p id="hl-wallet-hint" className="text-xs text-muted-foreground/60">
          {hlWalletValid
            ? "This should match the wallet you use on Hyperliquid. Not\u00a0right? Change it\u00a0above."
            : "Enter the wallet address you trade with on\u00a0Hyperliquid"}
        </p>
        <div id="hl-wallet-error" role="alert" className="min-h-[1.25rem]">
          {showHlWalletError && (
            <p className="text-xs text-destructive">
              Enter a valid address — 0x followed by 40 hex characters
            </p>
          )}
        </div>
      </div>

      {/* ─── 2. Payment Method Selector ─── */}
      <div className="w-full max-w-lg mt-2 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">
          Payment method
        </p>
        <div
          role="radiogroup"
          aria-label="Select payment method"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {/* Hyperliquid EIP-712 — default, shiny animated border + solid stroke when selected */}
          <div className={`rounded-xl p-[1.5px] transition-colors duration-200 ${
            paymentMethod === "eip712" ? "hl-shiny-border ring-[1.5px] ring-teal-400/80" : "bg-white/[0.1] hover:bg-white/[0.15]"
          }`}>
            <button
              type="button"
              role="radio"
              aria-checked={paymentMethod === "eip712"}
              onClick={() => {
                setPaymentMethod("eip712");
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Pay with Hyperliquid</p>
                    <span className="text-[11px] leading-none font-semibold uppercase tracking-wide text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">Recommended</span>
                  </div>
                  <p className="text-xs text-muted-foreground">USDC from trading account</p>
                </div>
              </div>
            </button>
          </div>

          {/* Pay with Wallet — USDC on Base */}
          <button
            type="button"
            role="radio"
            aria-checked={paymentMethod === "base"}
            onClick={() => {
              setPaymentMethod("base");
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

        {/* Inline requirements hint for EIP-712 */}
        {paymentMethod === "eip712" && (
          <p className="text-xs text-muted-foreground text-balance">
            Your connected wallet must own the Hyperliquid account. Only withdrawable USDC is&nbsp;available — funds in open positions are&nbsp;excluded.
          </p>
        )}
      </div>

      {/* ─── 3. Wallet Connection (for eip712/base) ─── */}
      {paymentMethod && (paymentMethod === "eip712" || paymentMethod === "base") && !isConnected && (
        <div className="w-full max-w-lg mt-4 space-y-4 text-center">
          <p className="text-sm text-muted-foreground text-balance max-w-md mx-auto">
            {paymentMethod === "base"
              ? <>Connect the wallet you&#8217;ll use to pay with USDC on&nbsp;Base.</>
              : "Connect the wallet that owns your Hyperliquid account to sign and transfer USDC."}
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
                    {paymentMethod === "base" ? <Wallet size={18} weight="bold" /> : <ShieldCheck size={18} weight="bold" />}
                    Connect Wallet
                  </span>
                </button>
              </div>
            )}
          </ConnectButton.Custom>
        </div>
      )}

      {/* Wallet connected indicator */}
      {paymentMethod && (paymentMethod === "eip712" || paymentMethod === "base") && isConnected && (
        <div className="w-full max-w-lg mt-4">
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
        </div>
      )}

      {/* Base: switch chain if needed */}
      {paymentMethod === "base" && isConnected && !isOnBase && (
        <div className="w-full max-w-lg mt-4">
          <Button
            onClick={() => switchChain({ chainId: BASE_CHAIN_ID })}
            className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
          >
            Switch to {CHAIN_LABEL}
          </Button>
        </div>
      )}

      {/* ─── Continue to Review ─── */}
      <div className="w-full max-w-lg mt-6">
        <Button
          onClick={() => {
            if (!payoutPrefilled && hlAddressReady) {
              setPayoutWallet(hlWallet);
              setPayoutPrefilled(true);
            }
            onContinueToConfirm?.();
          }}
          disabled={!canContinueToConfirm}
          className={`
            w-full h-11 text-sm font-semibold cursor-pointer
            ${canContinueToConfirm ? "shiny-cta" : "bg-teal-400 text-zinc-950 hover:bg-teal-400/90"}
            disabled:opacity-40 disabled:cursor-not-allowed
          `}
        >
          <span className="inline-flex items-center gap-2">
            Continue to review
            <ArrowRight size={14} weight="bold" />
          </span>
        </Button>
      </div>

      {/* Back to plan selection */}
      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 h-11 px-4 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
      >
        <ArrowLeft size={14} weight="bold" />
        Back to plan selection
      </button>
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
