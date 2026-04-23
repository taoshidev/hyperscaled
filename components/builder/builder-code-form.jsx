"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useChainId,
  useSwitchChain,
  useWalletClient,
} from "wagmi";
import {
  ArrowsClockwise,
  CheckCircle,
  Info,
  ShieldCheck,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  HL_API_URL,
  HL_CHAIN_NAME,
  HL_SIGNING_CHAIN_ID,
  HYPERSCALED_BUILDER_ADDRESS,
} from "@/lib/constants";
import { truncateAddress } from "@/lib/format";
import { reportCritical } from "@/lib/errors";

const FEE_RATE_RE = /^\s*\d+(\.\d+)?\s*%\s*$/;
const PERP_CAP_PERCENT = 0.1;
const SPOT_CAP_PERCENT = 1;

function parseFeePercent(input) {
  if (!FEE_RATE_RE.test(input)) return null;
  const n = Number(input.replace("%", "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function normalizeFeeRate(input) {
  const n = parseFeePercent(input);
  if (n == null) return input.trim();
  // Preserve user's formatting but strip whitespace
  return `${n}%`;
}

function validateFeeRate(input) {
  if (!input.trim()) return { ok: false, error: "Enter a fee rate." };
  const n = parseFeePercent(input);
  if (n == null)
    return { ok: false, error: "Use a percentage like 0.05%." };
  if (n > SPOT_CAP_PERCENT)
    return { ok: false, error: `Max allowed is ${SPOT_CAP_PERCENT}% (spot cap).` };
  if (n > PERP_CAP_PERCENT)
    return {
      ok: true,
      warning: `Above ${PERP_CAP_PERCENT}% perp cap — only spot orders will use this rate.`,
    };
  return { ok: true };
}

export function BuilderCodeForm() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [feeRateInput, setFeeRateInput] = useState("0.05%");
  const [signState, setSignState] = useState("idle"); // idle | switching | signing | submitting | success | error
  const [signError, setSignError] = useState("");

  const [currentApproval, setCurrentApproval] = useState(null); // null | "none" | string
  const [currentState, setCurrentState] = useState("idle"); // idle | loading | ready | error
  const lastFetchedFor = useRef(null);

  const validation = validateFeeRate(feeRateInput);

  const fetchCurrentApproval = useCallback(async (user) => {
    if (!user) return;
    setCurrentState("loading");
    try {
      const res = await fetch(`${HL_API_URL}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "maxBuilderFee",
          user,
          builder: HYPERSCALED_BUILDER_ADDRESS,
        }),
      });
      if (!res.ok) throw new Error(`info ${res.status}`);
      const body = await res.json();
      // HL returns a number representing tenths of basis points (e.g. 10 = 1bp = 0.01%).
      // If the user has no approval, the API returns 0.
      const tenthsBp = Number(body ?? 0);
      if (!Number.isFinite(tenthsBp) || tenthsBp <= 0) {
        setCurrentApproval("none");
      } else {
        const percent = tenthsBp / 1000; // 1000 tenths-of-bp = 1%
        const rounded = Number(percent.toFixed(5)).toString();
        setCurrentApproval(`${rounded}%`);
      }
      setCurrentState("ready");
    } catch (err) {
      console.warn("[BUILDER] maxBuilderFee query failed", { error: err?.message });
      setCurrentState("error");
    }
  }, []);

  useEffect(() => {
    if (isConnected && address && lastFetchedFor.current !== address) {
      lastFetchedFor.current = address;
      fetchCurrentApproval(address);
    } else if (!isConnected) {
      lastFetchedFor.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on disconnect
      setCurrentApproval(null);
      setCurrentState("idle");
    }
  }, [isConnected, address, fetchCurrentApproval]);

  const handleSign = useCallback(async () => {
    if (!walletClient || !address) return;
    const check = validateFeeRate(feeRateInput);
    if (!check.ok) {
      setSignError(check.error || "Invalid fee rate.");
      setSignState("error");
      return;
    }

    const maxFeeRate = normalizeFeeRate(feeRateInput);
    const nonce = Date.now();
    const previousChainId = chainId;

    setSignError("");
    setSignState("switching");

    try {
      if (chainId !== HL_SIGNING_CHAIN_ID) {
        try {
          await switchChainAsync({ chainId: HL_SIGNING_CHAIN_ID });
        } catch (switchErr) {
          const msg = switchErr?.message || "";
          if (
            msg.includes("not supported") ||
            msg.includes("Unrecognized chain") ||
            msg.includes("unknown chain") ||
            msg.includes("addEthereumChain") ||
            switchErr?.code === 4902
          ) {
            throw new Error(
              "Your wallet doesn't support Arbitrum. Please switch to a wallet that supports Arbitrum (e.g. MetaMask, Rabby, or Coinbase Wallet).",
            );
          }
          throw switchErr;
        }
      }

      setSignState("signing");

      const { getWalletClient } = await import("wagmi/actions");
      const { wagmiConfig } = await import("@/lib/wagmi");
      const freshClient = await getWalletClient(wagmiConfig, {
        chainId: HL_SIGNING_CHAIN_ID,
      });

      const signature = await freshClient.signTypedData({
        domain: {
          name: "HyperliquidSignTransaction",
          version: "1",
          chainId: HL_SIGNING_CHAIN_ID,
          verifyingContract: "0x0000000000000000000000000000000000000000",
        },
        types: {
          "HyperliquidTransaction:ApproveBuilderFee": [
            { name: "hyperliquidChain", type: "string" },
            { name: "maxFeeRate", type: "string" },
            { name: "builder", type: "address" },
            { name: "nonce", type: "uint64" },
          ],
        },
        primaryType: "HyperliquidTransaction:ApproveBuilderFee",
        message: {
          hyperliquidChain: HL_CHAIN_NAME,
          maxFeeRate,
          builder: HYPERSCALED_BUILDER_ADDRESS,
          nonce,
        },
      });

      const r = "0x" + signature.slice(2, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      setSignState("submitting");

      const exchangeRes = await fetch(`${HL_API_URL}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: {
            type: "approveBuilderFee",
            signatureChainId: "0x" + HL_SIGNING_CHAIN_ID.toString(16),
            hyperliquidChain: HL_CHAIN_NAME,
            maxFeeRate,
            builder: HYPERSCALED_BUILDER_ADDRESS,
            nonce,
          },
          nonce,
          signature: { r, s, v },
        }),
      });

      if (!exchangeRes.ok) {
        const data = await exchangeRes.json().catch(() => ({}));
        const err = new Error(
          data.error || data.message || "Hyperliquid rejected the approval.",
        );
        reportCritical(err, {
          source: "builder/approve-fee",
          userId: address,
          metadata: {
            step: "hl_exchange_http",
            httpStatus: exchangeRes.status,
            maxFeeRate,
            nonce,
          },
        });
        throw err;
      }

      const result = await exchangeRes.json();
      if (result.status !== "ok") {
        const err = new Error(
          typeof result.response === "string"
            ? result.response
            : "Hyperliquid rejected the approval.",
        );
        reportCritical(err, {
          source: "builder/approve-fee",
          userId: address,
          metadata: {
            step: "hl_exchange_status",
            hlStatus: result.status,
            hlResponse: result.response,
            maxFeeRate,
            nonce,
          },
        });
        throw err;
      }

      setSignState("success");
      // Re-query so the "Current approval" panel reflects the new rate.
      fetchCurrentApproval(address);
    } catch (err) {
      setSignError(err?.message || "Signing failed.");
      setSignState("error");
    } finally {
      if (previousChainId && previousChainId !== HL_SIGNING_CHAIN_ID) {
        switchChainAsync({ chainId: previousChainId }).catch(() => {});
      }
    }
  }, [
    walletClient,
    address,
    chainId,
    feeRateInput,
    switchChainAsync,
    fetchCurrentApproval,
  ]);

  const isBusy =
    signState === "switching" ||
    signState === "signing" ||
    signState === "submitting";

  const canSign = isConnected && validation.ok && !isBusy;

  const signStepLabel = {
    switching: "Switching to Arbitrum…",
    signing: "Waiting for signature…",
    submitting: "Submitting to Hyperliquid…",
  }[signState];

  return (
    <main className="min-h-[100dvh] px-4 py-12 md:py-16">
      <div className="mx-auto w-full max-w-xl space-y-6">
        {/* Hero */}
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Approve the Hyperscaled builder code
          </h1>
          <p className="text-sm text-muted-foreground">
            A one-time signature that lets Hyperscaled route your orders through
            Hyperliquid. Revocable any time, capped at the rate you set.
          </p>
        </header>

        {/* Explainer */}
        <Card>
          <CardContent className="p-5">
            <div className="flex gap-3">
              <Info weight="duotone" className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
              <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Hyperliquid builder codes let approved builders attach a small
                  fee to orders placed on behalf of users. Hyperscaled uses this
                  to sustain the network and pay miner rewards.
                </p>
                <p>
                  You sign a max fee rate once. Hyperscaled can never charge
                  more than the rate you approve, and you can revoke the
                  approval at any time from your wallet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connect / identity */}
        <Card>
          <CardContent className="space-y-4 p-5">
            {!isConnected ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-muted-foreground">
                  Connect the main wallet you trade from on Hyperliquid.
                </p>
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Connected wallet
                  </div>
                  <div className="font-mono text-sm">
                    {truncateAddress(address)}
                  </div>
                </div>
                <ConnectButton showBalance={false} chainStatus="none" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current approval */}
        {isConnected && (
          <Card>
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Current approval
                </div>
                <button
                  type="button"
                  onClick={() => fetchCurrentApproval(address)}
                  disabled={currentState === "loading"}
                  aria-label="Refresh current approval"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-white/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
                >
                  <ArrowsClockwise
                    weight="bold"
                    className={
                      currentState === "loading" ? "h-4 w-4 animate-spin" : "h-4 w-4"
                    }
                  />
                </button>
              </div>

              {currentState === "loading" && (
                <div className="skeleton h-6 w-40" aria-hidden="true" />
              )}

              {currentState === "ready" && currentApproval === "none" && (
                <div className="text-sm text-muted-foreground">
                  No approval on file. Sign below to set one.
                </div>
              )}

              {currentState === "ready" &&
                currentApproval &&
                currentApproval !== "none" && (
                  <div className="flex items-center gap-2">
                    <span
                      className="pulse-teal inline-block h-2 w-2 rounded-full bg-teal-400"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-muted-foreground">
                      Approved max fee:
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {currentApproval}
                    </span>
                  </div>
                )}

              {currentState === "error" && (
                <div className="text-sm text-muted-foreground">
                  Couldn&apos;t reach Hyperliquid. Try refreshing.
                </div>
              )}

              <div className="pt-1 text-xs text-muted-foreground">
                Builder:{" "}
                <span className="font-mono">
                  {truncateAddress(HYPERSCALED_BUILDER_ADDRESS)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee rate + sign */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-2">
              <label
                htmlFor="maxFeeRate"
                className="text-xs uppercase tracking-wide text-muted-foreground"
              >
                Max fee rate
              </label>
              <input
                id="maxFeeRate"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={feeRateInput}
                onChange={(e) => setFeeRateInput(e.target.value)}
                disabled={isBusy}
                aria-describedby="maxFeeRateHelp"
                aria-invalid={!validation.ok}
                className="h-11 w-full rounded-md border border-white/10 bg-background px-3 font-mono text-sm outline-none transition-[border-color,box-shadow] focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
              />
              <p
                id="maxFeeRateHelp"
                className="text-xs text-muted-foreground"
              >
                Max 0.1% for perps · Max 1% for spot. Signed as a percent string
                (e.g. 0.05%).
              </p>
              {validation.warning && (
                <div className="flex items-start gap-2 text-xs text-amber-400">
                  <Warning weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{validation.warning}</span>
                </div>
              )}
              {!validation.ok && feeRateInput.trim() !== "" && (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <Warning weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{validation.error}</span>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleSign}
              disabled={!canSign}
              className="h-11 w-full focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ShieldCheck weight="bold" className="h-4 w-4" />
              {isBusy ? "Working…" : "Sign & approve"}
            </Button>

            <div aria-live="polite" className="min-h-[1.25rem]">
              {isBusy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400"
                    aria-hidden="true"
                  />
                  {signStepLabel}
                </div>
              )}
              {signState === "success" && (
                <div className="flex items-center gap-2 text-xs text-teal-400">
                  <CheckCircle weight="fill" className="h-4 w-4" />
                  Approval submitted. Your current approval has been refreshed
                  above.
                </div>
              )}
              {signState === "error" && signError && (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <Warning weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{signError}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
