"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useConnect,
  useReadContract,
  useWalletClient,
  useSwitchChain,
  useDisconnect,
  useSignMessage,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  Warning,
  Wallet,
  Info,
  ShieldCheck,
  PencilSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import HyperstackEmailPopup from "@/components/registration/hyperstack-email-popup";
import { isValidHLAddress, isValidEmail } from "@/lib/validation";
import { trackEvent, getRefSource } from "@/lib/analytics";
import {
  USDC_ADDRESS,
  USDC_DECIMALS,
  BASE_CHAIN_ID,
  CHAIN_LABEL,
  CHROME_EXTENSION_URL,
  HL_API_URL,
  HL_SIGNING_CHAIN_ID,
  HL_CHAIN_NAME,
  HYPERLIQUID_SIGNUP_URL,
} from "@/lib/constants";
import { usdcAbi } from "@/lib/usdc-abi";
import { formatAccountSize, truncateAddress } from "@/lib/format";
import { ensureBuilderFeeApproved } from "@/lib/hl-builder-fee";
import { useExtensionBridge } from "@/hooks/use-extension-bridge";
import { useRegistrationHelp } from "./registration-help-context";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import {
  decodePaymentRequiredHeader,
  encodePaymentSignatureHeader,
} from "@x402/core/http";
import { reportCritical, reportError } from "@/lib/errors";
import { signRegistrationRequest } from "@/lib/sign-registration";
import { connectPreferredAccount } from "@/lib/connect-preferred-account";
import {
  persistConnectDraft,
  readConnectDraft,
} from "@/lib/registration-connect-draft";
import { withReloadSuppressed } from "@/lib/suppress-reload";
import {
  buildBaseRegisterBody,
  bundleSignedFor,
  bundleStillCovers,
  couponCodeHeader,
} from "@/lib/registration-base-body";

function formatRulesSummary(details) {
  return details
    .filter((d) => !(d.label === "Account Scaling" && d.value === "None"))
    .map((d) => {
      if (d.label === "Time Limit" && d.value === "None") return "No time limit";
      return `${d.value} ${d.label.toLowerCase()}`;
    })
    .join(" · ");
}

async function runPreflight(body, couponCode) {
  const couponHeader = couponCodeHeader(couponCode);
  console.info("[REGISTRATION] preflight request", {
    minerSlug: body.minerSlug,
    hlAddress: body.hlAddress,
    accountSize: body.accountSize,
    tierIndex: body.tierIndex,
    hlTransferSender: body.hlTransferSender,
    couponCode: couponHeader["x-coupon-code"],
  });
  let res;
  try {
    res = await fetch("/api/register/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...couponHeader },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[REGISTRATION] preflight fetch failed", { error: err?.message });
    throw new Error("Could not reach the registration server. Please try again.");
  }
  console.info("[REGISTRATION] preflight response", { status: res.status, ok: res.ok });
  if (res.ok) return;
  const data = await res.json().catch(() => ({}));
  console.warn("[REGISTRATION] preflight rejected", { status: res.status, error: data.error });
  throw new Error(
    data.error || data.message || "Registration is not available right now.",
  );
}

function getRegistrationErrorMessage(err) {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (typeof err.message === "string" && err.message.trim()) return err.message;
  if (typeof err.shortMessage === "string" && err.shortMessage.trim()) {
    return err.shortMessage;
  }
  if (typeof err.reason === "string" && err.reason.trim()) return err.reason;
  return "";
}

function isExpectedRegistrationBlocker(message) {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("at capacity") ||
    m.includes("not available") ||
    m.includes("invalid promo") ||
    m.includes("invalid tier") ||
    m.includes("rejected") ||
    m.includes("denied")
  );
}

function logRegistrationFailure(flowLabel, err) {
  const message = getRegistrationErrorMessage(err) || "Unknown error";
  if (isExpectedRegistrationBlocker(message)) {
    console.warn(`[REGISTRATION] ${flowLabel} blocked:`, message);
  } else {
    console.error(`[REGISTRATION] ${flowLabel} failed:`, message);
  }
  return message;
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
  brandVariant = "hyperscaled",
  initialPromoCode,
}) {
  const { address, isConnected, chainId, connector } = useAccount();
  const connectedWalletName = connector?.name || "your wallet";
  const { switchChain, switchChainAsync } = useSwitchChain();
  const { disconnectAsync } = useDisconnect();
  const { connectAsync, connectors } = useConnect();
  const { openConnectModal: openRainbowConnectModal } = useConnectModal();
  const [pendingReconnect, setPendingReconnect] = useState(false);
  const hlConnectTargetRef = useRef(null);
  const connectDraftRestoredRef = useRef(false);
  const { data: walletClient } = useWalletClient();
  const { signMessageAsync } = useSignMessage();

  const [paymentState, setPaymentState] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [hlWallet, setHlWallet] = useState("");
  const [hlWalletTouched, setHlWalletTouched] = useState(false);
  const [payoutWallet, setPayoutWallet] = useState("");
  const [payoutPrefilled, setPayoutPrefilled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("eip712");
  const [confirmed, setConfirmed] = useState(false);
  const [editingPayout, setEditingPayout] = useState(false);
  const [editPayoutValue, setEditPayoutValue] = useState("");
  const [editingHlWallet, setEditingHlWallet] = useState(true);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [hlBalance, setHlBalance] = useState(null);
  const [hlBalanceLoading, setHlBalanceLoading] = useState(false);
  const [eip712Step, setEip712Step] = useState(null);
  const [devPrice, setDevPrice] = useState(null);

  useEffect(() => {
    if (
      pendingReconnect &&
      !isConnected &&
      typeof openRainbowConnectModal === "function"
    ) {
      setPendingReconnect(false);
      openRainbowConnectModal();
    }
  }, [pendingReconnect, isConnected, openRainbowConnectModal]);

  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    if (connectDraftRestoredRef.current || !selectedTier?.accountSize) return;
    const draft = readConnectDraft({
      minerSlug,
      accountSize: selectedTier.accountSize,
    });
    if (!draft) return;
    connectDraftRestoredRef.current = true;
    if (draft.hlWallet) {
      setHlWallet(draft.hlWallet);
      setHlWalletTouched(true);
      setEditingHlWallet(false);
    }
    if (draft.email) {
      setEmail(draft.email);
      setEmailTouched(true);
    }
    if (draft.couponCode) {
      setCouponCode(draft.couponCode);
    }
    if (draft.payoutWallet) {
      setPayoutWallet(draft.payoutWallet);
    }
    if (draft.paymentMethod) {
      setPaymentMethod(draft.paymentMethod);
    }
  }, [minerSlug, selectedTier?.accountSize]);

  const armConnectDraft = useCallback(() => {
    if (!selectedTier?.accountSize) return;
    persistConnectDraft({
      minerSlug,
      accountSize: selectedTier.accountSize,
      hlWallet,
      email,
      couponCode,
      paymentMethod,
      payoutWallet,
    });
  }, [
    minerSlug,
    selectedTier?.accountSize,
    hlWallet,
    email,
    couponCode,
    paymentMethod,
    payoutWallet,
  ]);
  const [couponPricing, setCouponPricing] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [hlOwnershipBundle, setHlOwnershipBundle] = useState(null);
  const [signingOwnership, setSigningOwnership] = useState(false);
  const hlOwnershipAnchorRef = useRef(null);
  const lastConnectedAddressRef = useRef(null);
  const [hlMismatchReconnecting, setHlMismatchReconnecting] = useState(false);

  const {
    resetPaymentStatus,
  } = useExtensionBridge();

  const { handleHelpFocus, handleHelpBlur } = useRegistrationHelp();

  // Per-brand HubSpot lead form. Hyperstack (bitcast) uses its own portal/form so
  // leads route to its own CRM; hyperscaled + vanta use the platform form (env).
  const BRAND_HUBSPOT = {
    bitcast: { portalId: "51676532", formId: "1b76c44b-0d48-4513-9b98-6e0a99b9ec74" },
  };
  const brandHubspot = BRAND_HUBSPOT[brandVariant];
  const hsPortalId = brandHubspot?.portalId || process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || "";
  const hsFormId = brandHubspot?.formId || process.env.NEXT_PUBLIC_HUBSPOT_FORM_ID || "";
  // hyperscaled + vanta: inline HubSpot email field on this step.
  const isHubspotBrand =
    (brandVariant === "hyperscaled" || brandVariant === "vanta") &&
    hsPortalId &&
    hsFormId;
  // Hyperstack (bitcast): email is captured via a mandatory popup on this step
  // (routes to Hyperstack's own CRM) instead of an inline field.
  const isEmailPopupBrand =
    brandVariant === "bitcast" && hsPortalId && hsFormId;
  // Capture the popup's email into registration state; once a valid email is set,
  // the parent stops rendering the popup (it closes).
  const handleEmailCaptured = useCallback((capturedEmail) => {
    if (capturedEmail) {
      setEmail(capturedEmail);
      setEmailTouched(true);
    }
  }, []);
  const hubspotFormReadyRef = useRef(false);
  const hubspotFormContainerRef = useRef(null);
  // Drives the fade-in / skeleton state for the embedded form so the user
  // doesn't see a momentary blank-then-pop when arriving at step 2.
  const [hubspotFormReady, setHubspotFormReady] = useState(false);

  // ── Load and create HubSpot email form for HS/Vanta brands ──────────────
  // The component stays mounted across step 1 ↔ step 2 (its parent only
  // toggles `phase`), but the `<div id="hubspot-email-form">` container is
  // unmounted while we're on the confirm phase and re-created when the user
  // navigates back. Re-run the effect on every transition into the connect
  // phase so the embedded form is rebuilt into the fresh container.
  useEffect(() => {
    if (!isHubspotBrand || phase !== "connect") return;

    let cancelled = false;
    hubspotFormReadyRef.current = false;
    setHubspotFormReady(false);

    // Safety net — if HubSpot's `onFormReady` doesn't fire within 5s
    // (network blocked, ad-blocker, third-party hiccup, …) reveal whatever
    // is in the container so the user isn't stuck on a permanent skeleton.
    const fallbackTimer = setTimeout(() => {
      if (!cancelled && !hubspotFormReadyRef.current) {
        setHubspotFormReady(true);
      }
    }, 5000);

    const createForm = () => {
      if (cancelled || hubspotFormReadyRef.current) return;
      const container = document.getElementById("hubspot-email-form");
      if (!container || !window.hbspt) return;

      // Clear any previous form instance
      container.innerHTML = "";

      window.hbspt.forms.create({
        portalId: hsPortalId,
        formId: hsFormId,
        region: "na1",
        target: "#hubspot-email-form",
        onFormReady: ($form) => {
          if (cancelled) return;
          hubspotFormReadyRef.current = true;

          // Find the email input and sync with React state
          const input = $form?.[0]?.querySelector('input[type="email"], input[name="email"]')
            || container.querySelector('input[type="email"], input[name="email"]');

          if (input) {
            input.setAttribute("data-testid", "reg-email");
            // Set placeholder to match our design
            input.placeholder = "you@example.com";

            // Pre-fill if email already in state (e.g. back-navigation)
            if (email) input.value = email;

            input.addEventListener("input", (e) => {
              setEmail(e.target.value);
            });
            input.addEventListener("blur", () => {
              setEmailTouched(true);
            });
          }

          // Defer the fade-in by one frame so the styled input is fully laid
          // out before we transition `opacity: 0 → 1`. Without this the user
          // can briefly see HubSpot's default unstyled markup.
          requestAnimationFrame(() => {
            if (!cancelled) setHubspotFormReady(true);
          });
        },
      });
    };

    if (window.hbspt) {
      // Script already loaded — create synchronously.
      createForm();
    } else {
      const existingScript = document.querySelector('script[src*="hsforms.net"]');
      if (existingScript) {
        existingScript.addEventListener("load", createForm);
      } else {
        const script = document.createElement("script");
        script.src = "//js.hsforms.net/forms/embed/v2.js";
        script.charset = "utf-8";
        script.async = true;
        script.onload = createForm;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
    };
  }, [isHubspotBrand, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const hlWalletValid = isValidHLAddress(hlWallet);
  const showHlWalletError = hlWalletTouched && hlWallet.length > 0 && !hlWalletValid;
  const emailValid = email.length === 0 || isValidEmail(email);
  const emailReady = email.length > 0 && isValidEmail(email);
  // Email is collected on every brand (HubSpot widget for Vanta/Hyperscaled,
  // a plain input elsewhere) and required to advance to the review step.
  const showEmailError =
    emailTouched && (email.length === 0 || !emailValid);

  // Funnel events — one-shot so we don't double-count on rerenders, toggling,
  // or user going back and forward through steps.
  const walletProvidedFiredRef = useRef(false);
  const paymentMethodsFiredRef = useRef(new Set());

  useEffect(() => {
    if (!hlWalletValid || walletProvidedFiredRef.current) return;
    walletProvidedFiredRef.current = true;
    trackEvent("register_wallet_provided", {
      wallet_method: address && hlWallet.toLowerCase() === address.toLowerCase() ? "connected" : "manual",
      tier_name: selectedTier?.name,
      ref_source: getRefSource(),
      brand_variant: brandVariant,
    });
  }, [hlWalletValid, address, hlWallet, selectedTier, brandVariant]);

  useEffect(() => {
    if (!paymentMethod) return;
    if (paymentMethodsFiredRef.current.has(paymentMethod)) return;
    paymentMethodsFiredRef.current.add(paymentMethod);
    trackEvent("register_payment_method_selected", {
      payment_method: paymentMethod === "base" ? "wallet" : "hyperliquid",
      tier_name: selectedTier?.name,
      ref_source: getRefSource(),
      brand_variant: brandVariant,
    });
  }, [paymentMethod, selectedTier, brandVariant]);

  useEffect(() => {
    if (phase === "connect" && paymentState === "error") {
      setPaymentState("idle");
      setEip712Step(null);
      setErrorMessage("");
    }
  }, [phase, paymentState]);

  useEffect(() => {
    if (paymentState !== "error") return;
    setPaymentState("idle");
    setEip712Step(null);
    setErrorMessage("");
  }, [hlWallet, couponCode, email]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch tier pricing when HL wallet is entered (dev wallets get reduced
  // price). Discount applies if either the HL trading wallet OR the connected
  // paying wallet is in DEV_TEST_WALLETS.
  useEffect(() => {
    if (!selectedTier || !hlWalletValid || !minerSlug) {
      setDevPrice(null);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ wallet: hlWallet });
    if (address) params.set("payer", address);
    fetch(`/api/miners/${minerSlug}?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.tiers) return;
        const match = data.tiers.find(
          (t) => t.accountSize === selectedTier.accountSize,
        );
        if (match && match.promoPrice !== selectedTier.promoPrice) {
          console.info("[REGISTRATION] dev-wallet price applied", {
            hlWallet,
            payer: address,
            originalPromo: selectedTier.promoPrice,
            devPromo: match.promoPrice,
          });
          setDevPrice(match.promoPrice);
        } else {
          setDevPrice(null);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.warn("[REGISTRATION] dev-price refetch failed", { error: err?.message });
        }
      });
    return () => controller.abort();
  }, [hlWallet, hlWalletValid, minerSlug, address, selectedTier?.accountSize, selectedTier?.promoPrice]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const fromProp =
        typeof initialPromoCode === "string"
          ? initialPromoCode.trim().toUpperCase()
          : "";
      if (fromProp) {
        if (!cancelled) setCouponCode(fromProp);
        return;
      }
      try {
        const res = await fetch("/api/register/attribution-promo");
        const json = await res.json().catch(() => ({}));
        const p =
          typeof json.promo === "string" ? json.promo.trim().toUpperCase() : "";
        if (!cancelled && p) setCouponCode(p);
      } catch {
        /* ignore */
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [initialPromoCode]);

  useEffect(() => {
    const trimmedUpper = couponCode.trim().toUpperCase();
    if (!trimmedUpper) {
      setCouponPricing(null);
      setCouponLoading(false);
      return;
    }
    if (!minerSlug || selectedTier == null || tierIndex == null) return;

    let cancelled = false;
    const t = window.setTimeout(async () => {
      if (cancelled) return;
      setCouponLoading(true);
      try {
        const payload = {
          minerSlug,
          tierIndex,
          accountSize: selectedTier.accountSize,
          ...(hlWalletValid ? { hlAddress: hlWallet } : {}),
          ...(address ? { hlTransferSender: address } : {}),
          ...(emailReady ? { email } : {}),
          couponCode: trimmedUpper,
        };
        const res = await fetch("/api/register/validate-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setCouponPricing({
            ok: false,
            error:
              typeof json.error === "string"
                ? json.error
                : "Invalid promo code.",
            validatedFor: trimmedUpper,
          });
        } else {
          setCouponPricing({ ...json, validatedFor: trimmedUpper });
        }
      } catch {
        if (!cancelled) {
          setCouponPricing({
            ok: false,
            error: "Could not validate promo code.",
            validatedFor: trimmedUpper,
          });
        }
      } finally {
        if (!cancelled) setCouponLoading(false);
      }
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    couponCode,
    minerSlug,
    tierIndex,
    selectedTier,
    hlWallet,
    hlWalletValid,
    address,
    emailReady,
    email,
  ]);

  const tierListDisplay = devPrice ?? selectedTier.promoPrice;

  const promoNeedsServer = couponCode.trim().length > 0;
  const promoTrimmedUpper = couponCode.trim().toUpperCase();

  const couponPricingMatchesInput =
    !promoNeedsServer ||
    (couponPricing != null &&
      couponPricing.validatedFor === promoTrimmedUpper);

  const promoCheckingForCurrentInput =
    promoNeedsServer && couponLoading && !couponPricingMatchesInput;

  const promoReady =
    !promoNeedsServer ||
    (couponPricingMatchesInput && couponPricing?.ok === true);

  const promoFieldErrorMsg =
    promoNeedsServer &&
    couponPricingMatchesInput &&
    couponPricing?.ok === false
      ? couponPricing.error || "Invalid promo code."
      : null;

  const lastGoodCouponPricing =
    couponPricing && couponPricing.ok === true ? couponPricing : null;

  const price =
    promoNeedsServer && lastGoodCouponPricing?.effectivePrice != null
      ? Number(lastGoodCouponPricing.effectivePrice)
      : tierListDisplay;

  const isFree = Number(price) === 0;

  const challengeFeeBasisUsd =
    lastGoodCouponPricing?.baseAfterWallet != null
      ? Number(lastGoodCouponPricing.baseAfterWallet)
      : tierListDisplay;

  const showPromoDiscountLine =
    promoNeedsServer &&
    lastGoodCouponPricing?.couponApplied === true &&
    Number(lastGoodCouponPricing.discountAmount ?? 0) > 0;

  const promoDiscountUsd = showPromoDiscountLine
    ? Number(lastGoodCouponPricing.discountAmount)
    : 0;

  const promoCodeUpperDisplay = promoTrimmedUpper;

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
    if (isConnected && address) {
      lastConnectedAddressRef.current = address;
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (walletMatchesHL && hlAddressReady) {
      hlOwnershipAnchorRef.current = hlWallet.toLowerCase();
      setHlMismatchReconnecting(false);
      hlConnectTargetRef.current = null;
    }
  }, [walletMatchesHL, hlWallet, hlAddressReady]);

  const handleConnectDifferentHlWallet = useCallback(async () => {
    if (!hlWallet || !isValidHLAddress(hlWallet)) return;

    hlConnectTargetRef.current = hlWallet.toLowerCase();
    setHlMismatchReconnecting(true);
    setConfirmed(false);
    if (paymentState === "error") {
      setPaymentState("idle");
      setErrorMessage("");
    }
    armConnectDraft();

    try {
      const outcome = await connectPreferredAccount({
        targetAddress: hlWallet,
        disconnectAsync,
        connectAsync,
        connectors,
        chainId: BASE_CHAIN_ID,
      });
      if (outcome === "modal") {
        setPendingReconnect(true);
      } else if (outcome === "rejected" || outcome === "pending") {
        hlConnectTargetRef.current = null;
      }
    } catch {
      hlConnectTargetRef.current = null;
    }
  }, [
    hlWallet,
    paymentState,
    disconnectAsync,
    connectAsync,
    connectors,
    armConnectDraft,
  ]);

  const handleConnectForEip712 = useCallback(async () => {
    if (paymentState === "error") {
      setPaymentState("idle");
      setErrorMessage("");
    }
    setConfirmed(false);

    if (!hlWallet || !isValidHLAddress(hlWallet)) {
      openRainbowConnectModal?.();
      return;
    }

    armConnectDraft();
    try {
      const outcome = await connectPreferredAccount({
        targetAddress: hlWallet,
        disconnectAsync,
        connectAsync,
        connectors,
        chainId: BASE_CHAIN_ID,
      });
      if (outcome === "modal") {
        openRainbowConnectModal?.();
      }
    } catch {
      openRainbowConnectModal?.();
    }
  }, [
    hlWallet,
    paymentState,
    disconnectAsync,
    connectAsync,
    connectors,
    openRainbowConnectModal,
    armConnectDraft,
  ]);

  const currentBundleSignedFor = bundleSignedFor({
    minerSlug,
    hlAddress: resolvedHlAddress,
    accountSize: selectedTier?.accountSize,
    tierIndex,
    payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
    email: emailReady ? email : "",
  });
  const hlOwnershipBundleValid =
    !!hlOwnershipBundle && bundleStillCovers(hlOwnershipBundle, currentBundleSignedFor);
  useEffect(() => {
    if (hlOwnershipBundle && !hlOwnershipBundleValid) {
      const a = hlOwnershipBundle.signedFor;
      const b = currentBundleSignedFor;
      const diffs = Object.keys(b).filter((k) => a[k] !== b[k]);
      console.warn("[REGISTRATION] HL ownership bundle invalidated", {
        diffs,
        before: Object.fromEntries(diffs.map((k) => [k, a[k]])),
        after: Object.fromEntries(diffs.map((k) => [k, b[k]])),
      });
      setHlOwnershipBundle(null);
    }
  }, [hlOwnershipBundle, hlOwnershipBundleValid, currentBundleSignedFor]);

  useEffect(() => {
    if (hlOwnershipBundleValid && resolvedHlAddress) {
      hlOwnershipAnchorRef.current = resolvedHlAddress.toLowerCase();
    }
  }, [hlOwnershipBundleValid, resolvedHlAddress]);

  const hlOwnershipMismatchActive =
    hlAddressReady &&
    !walletMatchesHL &&
    ((paymentMethod === "eip712" || isFree) ||
      (paymentMethod === "base" && !hlOwnershipBundleValid));

  const showHlOwnershipMismatchBanner =
    hlOwnershipMismatchActive &&
    (isConnected || hlMismatchReconnecting);

  const bannerConnectedAddress =
    address || lastConnectedAddressRef.current || "";

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
        const total = spotAvailable + perpsWithdrawable;
        console.info("[REGISTRATION] HL balance fetched", {
          address,
          spotAvailable,
          perpsWithdrawable,
          total,
        });
        setHlBalance(total);
        setHlBalanceLoading(false);
      })
      .catch((err) => {
        console.warn("[REGISTRATION] HL balance fetch failed", { address, error: err?.message });
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
    if (!walletClient) {
      console.warn("[REGISTRATION] handlePayBase called with no walletClient");
      return;
    }

    console.info("[REGISTRATION] handlePayBase start", {
      minerSlug,
      hlAddress: resolvedHlAddress,
      payoutAddress: resolvedPayoutAddress || address,
      tierIndex,
    });

    setPaymentState("processing");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      const useCachedOwnership =
        hlOwnershipBundleValid && bundleStillCovers(hlOwnershipBundle, currentBundleSignedFor);

      let toltCustomerId = useCachedOwnership ? hlOwnershipBundle.toltCustomerId : null;
      if (!useCachedOwnership) {
        toltCustomerId = window.tolt_data?.customer_id || null;
        if (!toltCustomerId && window.tolt) {
          try {
            const result = await window.tolt.signup(resolvedHlAddress);
            toltCustomerId = result?.customer_id || window.tolt_data?.customer_id || null;
          } catch { /* tolt unavailable */ }
        }
      }

      let body;
      let ownershipHeaders;
      let signedBody;

      if (useCachedOwnership) {
        signedBody = hlOwnershipBundle.signedBody;
        ownershipHeaders = hlOwnershipBundle.headers;
        body = JSON.parse(signedBody);
      } else {
        body = {
          ...buildBaseRegisterBody({
            minerSlug,
            hlAddress: resolvedHlAddress,
            accountSize: selectedTier.accountSize,
            tierIndex,
            payoutAddress: resolvedPayoutAddress || address,
            email: emailReady ? email : undefined,
            toltCustomerId,
          }),
          hlTransferSender: address,
        };
      }

      // Block "already registered" and similar errors before requesting payment.
      await runPreflight(body, couponCode);

      if (!useCachedOwnership) {
        console.info("[REGISTRATION] Base: ensuring builder fee approval");
        const prevChainIdForBuilder = chainId;
        try {
          const result = await ensureBuilderFeeApproved({
            address,
            chainId,
            switchChainAsync,
          });
          console.info("[REGISTRATION] Base: builder fee approval", result);
        } finally {
          if (prevChainIdForBuilder && prevChainIdForBuilder !== HL_SIGNING_CHAIN_ID) {
            await switchChainAsync({ chainId: prevChainIdForBuilder }).catch(() => {});
          }
        }
      } else {
        console.info("[REGISTRATION] Base: skipping builder-fee approval (dual-wallet — done from HL)");
      }

      if (!useCachedOwnership) {
        try {
          const signed = await signRegistrationRequest({
            path: "/api/register",
            body,
            hlAddress: resolvedHlAddress,
            connectedAddress: address,
            signMessageAsync,
          });
          ownershipHeaders = signed.headers;
          signedBody = signed.body;
        } catch (err) {
          console.warn("[REGISTRATION] Base: ownership signature aborted", { error: err?.message });
          throw err;
        }
      } else {
        console.info("[REGISTRATION] Base: replaying cached HL ownership bundle for dual-wallet pay");
      }

      console.info("[REGISTRATION] Base: probing /api/register for 402");
      const couponHeader = couponCodeHeader(couponCode);
      const payerHeader = address ? { "x-payer-address": address } : {};
      const probeRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...couponHeader,
          ...payerHeader,
        },
        body: signedBody,
      });
      console.info("[REGISTRATION] Base: probe response", { status: probeRes.status });

      if (probeRes.status === 409) {
        const data = await probeRes.json().catch(() => ({}));
        throw new Error(data.error || "You are already registered with this miner.");
      }

      if (probeRes.ok) {
        const data = await probeRes.json().catch(() => ({}));
        if (data?.status === "registered" || typeof data?.txHash === "string") {
          console.info("[REGISTRATION] Base: dev-mode auto-register detected, skipping x402", {
            txHash: data.txHash,
            status: data.status,
          });
          setPaymentState("success");
          onPaymentProcessing?.(false);
          setTimeout(() => {
            onPaymentComplete({
              txHash: data.txHash || "",
              hlAddress: resolvedHlAddress,
              registrationStatus: data.status,
              paymentMethod: "base",
            });
          }, 1500);
          return;
        }
      }

      if (probeRes.status !== 402) {
        const data = await probeRes.json().catch(() => ({}));
        const err = new Error(data.error || "Unexpected response from registration server.");
        reportError(err, {
          source: "registration/pay-base",
          userId: address,
          metadata: {
            step: "base_probe_unexpected",
            httpStatus: probeRes.status,
            serverError: data.error,
            minerSlug,
            hlAddress: resolvedHlAddress,
            tierIndex,
          },
        });
        throw err;
      }

      const paymentRequiredHeader = probeRes.headers.get("PAYMENT-REQUIRED");
      if (!paymentRequiredHeader) {
        const err = new Error("No payment requirements received.");
        reportCritical(err, {
          source: "registration/pay-base",
          userId: address,
          metadata: { step: "base_probe_header_missing", minerSlug, hlAddress: resolvedHlAddress },
        });
        throw err;
      }
      const paymentRequired = decodePaymentRequiredHeader(paymentRequiredHeader);
      const requirements = paymentRequired.accepts?.[0];
      if (!requirements) {
        const err = new Error("No valid payment requirement in response.");
        reportCritical(err, {
          source: "registration/pay-base",
          userId: address,
          metadata: {
            step: "base_probe_accepts_empty",
            acceptsLength: paymentRequired.accepts?.length ?? 0,
            minerSlug,
            hlAddress: resolvedHlAddress,
          },
        });
        throw err;
      }
      console.info("[REGISTRATION] Base: payment requirements decoded", {
        amount: requirements.amount,
        payTo: requirements.payTo,
        network: requirements.network,
      });

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

      console.info("[REGISTRATION] Base: submitting signed payment to /api/register");
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "payment-signature": encodePaymentSignatureHeader(fullPayload),
          ...ownershipHeaders,
          ...couponHeader,
          ...payerHeader,
        },
        body: signedBody,
      });
      console.info("[REGISTRATION] Base: register response", { status: registerRes.status, ok: registerRes.ok });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        const err = new Error(
          data.error || data.message || "Registration failed. Please contact support.",
        );
        // User's Base USDC payment went through (or at least got signed) but
        // /api/register failed — money-losing state, must reach Sentry even if
        // the server-side reportCritical was dropped.
        reportCritical(err, {
          source: "registration/pay-base",
          userId: address,
          metadata: {
            step: "register_after_payment",
            httpStatus: registerRes.status,
            serverError: data.error,
            serverMessage: data.message,
            serverTxHash: data.txHash,
            minerSlug,
            hlAddress: resolvedHlAddress,
            payoutAddress: resolvedPayoutAddress || address,
            tierIndex,
          },
        });
        throw err;
      }

      const result = await registerRes.json();
      console.info("[REGISTRATION] Base: registration result", {
        status: result.status,
        txHash: result.txHash,
      });

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
      const message = logRegistrationFailure("Base payment", err);
      setPaymentState("error");
      onPaymentProcessing?.(false);

      if (message.includes("User rejected") || message.includes("denied")) {
        setErrorMessage("Signature rejected — you can try again when ready.");
      } else {
        setErrorMessage(message || "Payment failed — please try again.");
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
    resolvedHlAddress,
    resolvedPayoutAddress,
    email,
    emailReady,
    couponCode,
    onPaymentComplete,
    onPaymentProcessing,
    signMessageAsync,
    hlOwnershipBundle,
    hlOwnershipBundleValid,
    currentBundleSignedFor,
  ]);

  const captureHlOwnershipBundle = useCallback(async () => {
    if (!hlAddressReady || !address || !walletMatchesHL) {
      throw new Error(
        `Connect ${truncateAddress(hlWallet)} to verify Hyperliquid ownership.`,
      );
    }

    const prevChainIdForBuilder = chainId;
    try {
      await ensureBuilderFeeApproved({
        address,
        chainId,
        switchChainAsync,
      });
    } finally {
      if (prevChainIdForBuilder && prevChainIdForBuilder !== HL_SIGNING_CHAIN_ID) {
        await switchChainAsync({ chainId: prevChainIdForBuilder }).catch(() => {});
      }
    }

    let toltCustomerId = window.tolt_data?.customer_id || null;
    if (!toltCustomerId && window.tolt) {
      try {
        const result = await window.tolt.signup(resolvedHlAddress);
        toltCustomerId = result?.customer_id || window.tolt_data?.customer_id || null;
      } catch { /* tolt unavailable */ }
    }

    const body = buildBaseRegisterBody({
      minerSlug,
      hlAddress: resolvedHlAddress,
      accountSize: selectedTier.accountSize,
      tierIndex,
      payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
      email: emailReady ? email : undefined,
      toltCustomerId,
    });

    const signed = await signRegistrationRequest({
      path: "/api/register",
      body,
      hlAddress: resolvedHlAddress,
      connectedAddress: address,
      signMessageAsync,
    });

    setHlOwnershipBundle({
      headers: signed.headers,
      signedBody: signed.body,
      signedFor: bundleSignedFor({
        minerSlug,
        hlAddress: resolvedHlAddress,
        accountSize: selectedTier.accountSize,
        tierIndex,
        payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
        email: emailReady ? email : "",
      }),
      toltCustomerId,
      builderFeeApproved: true,
      signedAt: Date.now(),
    });
  }, [
    hlAddressReady,
    address,
    walletMatchesHL,
    hlWallet,
    chainId,
    switchChainAsync,
    minerSlug,
    selectedTier,
    tierIndex,
    resolvedHlAddress,
    resolvedPayoutAddress,
    email,
    emailReady,
    signMessageAsync,
  ]);

  const ownershipSignErrorMessage = (err) =>
    err?.message?.includes("User rejected") || err?.message?.includes("denied")
      ? "Signature rejected — try again when ready."
      : err?.message || "Could not sign HL ownership. Please try again.";

  const handleUseDifferentPayingWallet = useCallback(async () => {
    if (!walletMatchesHL || !hlAddressReady || !address || signingOwnership) return;

    setSigningOwnership(true);
    setErrorMessage("");
    armConnectDraft();
    try {
      await captureHlOwnershipBundle();
      await withReloadSuppressed(async () => {
        try {
          await disconnectAsync();
        } catch { /* already disconnected */ }
      });
      setPendingReconnect(true);
    } catch (err) {
      setErrorMessage(ownershipSignErrorMessage(err));
    } finally {
      setSigningOwnership(false);
    }
  }, [
    walletMatchesHL,
    hlAddressReady,
    address,
    signingOwnership,
    captureHlOwnershipBundle,
    disconnectAsync,
    armConnectDraft,
  ]);

  // ── Hyperliquid EIP-712 usdSend payment handler ──────────────────────────
  const handlePayEIP712 = useCallback(async () => {
    if (!walletClient) {
      console.warn("[REGISTRATION] handlePayEIP712 called with no walletClient");
      return;
    }

    console.info("[REGISTRATION] handlePayEIP712 start", {
      minerSlug,
      hlAddress: resolvedHlAddress,
      payoutAddress: resolvedPayoutAddress || address,
      tierIndex,
      price,
      destinationWallet: paymentWallet,
      signerAddress: address,
      currentChainId: chainId,
    });

    setPaymentState("processing");
    setEip712Step("builderFee");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      // Call tolt.signup() now so we have a customer_id before the server
      // records the transaction. Guard against double-calls on retry.
      let toltCustomerId = window.tolt_data?.customer_id || null;
      if (!toltCustomerId && window.tolt) {
        try {
          const result = await window.tolt.signup(resolvedHlAddress);
          toltCustomerId = result?.customer_id || window.tolt_data?.customer_id || null;
        } catch { /* tolt unavailable */ }
      }

      // Step 0 — Preflight validation (duplicate check, tier/miner sanity).
      // Runs before any signing/transfer so users never pay only to be told
      // they can't register.
      await runPreflight(
        {
          ...buildBaseRegisterBody({
            minerSlug,
            hlAddress: resolvedHlAddress,
            accountSize: selectedTier.accountSize,
            tierIndex,
            payoutAddress: resolvedPayoutAddress || address,
            email: emailReady ? email : undefined,
          }),
          hlTransferSender: address,
        },
        couponCode,
      );

      const amount = String(price);
      const nonce = Date.now();
      console.info("[REGISTRATION] EIP-712: preflight ok, amount+nonce prepared", { amount, nonce });

      // Step 1 — Switch to Arbitrum so the wallet's active chain matches
      // the EIP-712 domain chainId that Hyperliquid requires
      const previousChainId = chainId;
      if (chainId !== HL_SIGNING_CHAIN_ID) {
        console.info("[REGISTRATION] EIP-712: switching chain for signing", {
          from: chainId,
          to: HL_SIGNING_CHAIN_ID,
        });
        try {
          await switchChainAsync({ chainId: HL_SIGNING_CHAIN_ID });
        } catch (switchErr) {
          console.error("[REGISTRATION] EIP-712: chain switch failed", {
            error: switchErr?.message,
            code: switchErr?.code,
          });
          const msg = switchErr?.message || "";
          if (
            msg.includes("not supported") ||
            msg.includes("Unrecognized chain") ||
            msg.includes("unknown chain") ||
            msg.includes("addEthereumChain") ||
            switchErr?.code === 4902
          ) {
            throw new Error(
              "Your wallet doesn't support Arbitrum. Please switch to a wallet that supports Arbitrum and Base (e.g. MetaMask, Rabby, or Coinbase Wallet)."
            );
          }
          throw switchErr;
        }
      }

      // Step 1.5 — Ensure Hyperscaled builder fee is approved.
      // Already on Arbitrum, so no extra chain switching. Silent skip when an
      // approval already exists on this wallet.
      console.info("[REGISTRATION] EIP-712: ensuring builder fee approval");
      const builderFeeResult = await ensureBuilderFeeApproved({
        address,
        chainId: HL_SIGNING_CHAIN_ID,
        switchChainAsync,
      });
      console.info("[REGISTRATION] EIP-712: builder fee approval", builderFeeResult);

      // Step 2 — Sign Hyperliquid sendAsset (USDC) via EIP-712
      setEip712Step("signing");
      let signature;
      try {
        console.info("[REGISTRATION] EIP-712: requesting typed-data signature", {
          destination: paymentWallet,
          amount,
          nonce,
        });
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
        console.info("[REGISTRATION] EIP-712: signature obtained", { length: signature?.length });
      } finally {
        // Step 3 — Switch back to Base regardless of signing outcome
        if (previousChainId && previousChainId !== HL_SIGNING_CHAIN_ID) {
          console.info("[REGISTRATION] EIP-712: switching chain back", { to: previousChainId });
          switchChainAsync({ chainId: previousChainId }).catch((err) => {
            console.warn("[REGISTRATION] EIP-712: switch-back failed (non-fatal)", { error: err?.message });
          });
        }
      }

      // Split signature into r, s, v for Hyperliquid API
      const r = "0x" + signature.slice(2, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      // Step 4 — Submit signed transfer to Hyperliquid exchange API
      setEip712Step("submitting");
      console.info("[REGISTRATION] EIP-712: submitting to HL /exchange", {
        destination: paymentWallet,
        amount,
        nonce,
      });
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
        console.error("[REGISTRATION] EIP-712: HL /exchange non-ok", { status: exchangeRes.status, data });
        const err = new Error(data.error || data.message || "Hyperliquid transfer failed.");
        reportCritical(err, {
          source: "registration/pay-eip712",
          userId: address,
          metadata: {
            step: "hl_exchange_http",
            httpStatus: exchangeRes.status,
            serverError: data.error,
            serverMessage: data.message,
            destinationWallet: paymentWallet,
            amount,
            nonce,
            minerSlug,
            hlAddress: resolvedHlAddress,
          },
        });
        throw err;
      }

      const exchangeResult = await exchangeRes.json();
      console.info("[REGISTRATION] EIP-712: HL /exchange response", {
        status: exchangeResult.status,
        response: exchangeResult.response,
      });

      // HL exchange returns 200 even on failure — check the status field
      if (exchangeResult.status !== "ok") {
        const err = new Error(
          typeof exchangeResult.response === "string"
            ? exchangeResult.response
            : "Hyperliquid transfer failed.",
        );
        reportCritical(err, {
          source: "registration/pay-eip712",
          userId: address,
          metadata: {
            step: "hl_exchange_status",
            hlStatus: exchangeResult.status,
            hlResponse: exchangeResult.response,
            destinationWallet: paymentWallet,
            amount,
            nonce,
            minerSlug,
            hlAddress: resolvedHlAddress,
          },
        });
        throw err;
      }

      // Step 5 — Look up the transfer hash from HL info endpoint.
      // HL's non-funding ledger can lag the exchange API by several seconds.
      // Poll up to ~60s and accept updates within a 10-minute window to match
      // the backend's verification window.
      setEip712Step("verifying");
      let hlHash = "";
      const lookupStart = Date.now();
      const LOOKUP_TIMEOUT_MS = 60 * 1000;
      const LOOKUP_INTERVAL_MS = 3 * 1000;
      const MATCH_WINDOW_MS = 10 * 60 * 1000;
      let pollCount = 0;
      console.info("[REGISTRATION] EIP-712: starting HL tx-hash lookup polling", {
        timeoutMs: LOOKUP_TIMEOUT_MS,
        intervalMs: LOOKUP_INTERVAL_MS,
      });

      while (!hlHash && Date.now() - lookupStart < LOOKUP_TIMEOUT_MS) {
        pollCount += 1;
        try {
          const infoRes = await fetch(`${HL_API_URL}/info`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "userNonFundingLedgerUpdates",
              user: address,
              startTime: Date.now() - MATCH_WINDOW_MS,
            }),
          });
          if (infoRes.ok) {
            const updates = await infoRes.json();
            if (Array.isArray(updates)) {
              const match = updates.find((u) => {
                const d = u.delta;
                return (
                  d &&
                  d.type === "send" &&
                  d.token === "USDC" &&
                  (d.destination || "").toLowerCase() === paymentWallet.toLowerCase() &&
                  Math.abs(Number(d.amount || 0) - price) < 0.01 &&
                  Date.now() - (u.time || 0) < MATCH_WINDOW_MS
                );
              });
              if (match) {
                hlHash = match.hash || "";
                console.info("[REGISTRATION] EIP-712: tx hash matched", {
                  hlHash,
                  pollCount,
                  elapsedMs: Date.now() - lookupStart,
                });
                break;
              }
            }
          }
        } catch (e) {
          console.warn("[REGISTRATION] EIP-712: HL ledger lookup error", { pollCount, error: e.message });
        }
        await new Promise((r) => setTimeout(r, LOOKUP_INTERVAL_MS));
      }

      if (!hlHash) {
        console.error("[REGISTRATION] EIP-712: tx hash lookup timed out", {
          pollCount,
          elapsedMs: Date.now() - lookupStart,
        });
        // User's HL USDC transfer succeeded but we can't find the hash in 60s.
        // Server never saw this — it's the only signal Sentry will get.
        const err = new Error("Transfer succeeded but could not retrieve transaction hash. Please contact support.");
        reportCritical(err, {
          source: "registration/pay-eip712",
          userId: address,
          metadata: {
            step: "tx_hash_lookup_timeout",
            minerSlug,
            hlAddress: resolvedHlAddress,
            destinationWallet: paymentWallet,
            amount,
            nonce,
            pollCount,
            elapsedMs: Date.now() - lookupStart,
          },
        });
        throw err;
      }

      // Step 6 — Register with our backend
      setEip712Step("provisioning");
      console.info("[REGISTRATION] EIP-712: calling /api/register to provision", {
        minerSlug,
        hlAddress: resolvedHlAddress,
        hlHash,
      });
      const registerBody = {
        ...buildBaseRegisterBody({
          minerSlug,
          hlAddress: resolvedHlAddress,
          accountSize: selectedTier.accountSize,
          tierIndex,
          payoutAddress: resolvedPayoutAddress || address,
          email: emailReady ? email : undefined,
          toltCustomerId,
        }),
        paymentMethod: "eip712",
        hlTransferHash: hlHash,
        hlTransferSender: address,
      };
      const { headers: eip712OwnershipHeaders, body: eip712SignedBody } =
        await signRegistrationRequest({
          path: "/api/register",
          body: registerBody,
          hlAddress: resolvedHlAddress,
          connectedAddress: address,
          signMessageAsync,
        });
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...eip712OwnershipHeaders,
          ...couponCodeHeader(couponCode),
        },
        body: eip712SignedBody,
      });
      console.info("[REGISTRATION] EIP-712: /api/register response", {
        status: registerRes.status,
        ok: registerRes.ok,
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        const err = new Error(
          data.error || data.message || "Registration failed. Please contact support.",
        );
        // HL transfer already settled — user has paid. Must reach Sentry even
        // if the server-side reportCritical flush was dropped.
        reportCritical(err, {
          source: "registration/pay-eip712",
          userId: address,
          metadata: {
            step: "register_after_payment",
            httpStatus: registerRes.status,
            serverError: data.error,
            serverMessage: data.message,
            serverTxHash: data.txHash,
            hlTransferHash: hlHash,
            minerSlug,
            hlAddress: resolvedHlAddress,
            payoutAddress: resolvedPayoutAddress || address,
            tierIndex,
          },
        });
        throw err;
      }

      const result = await registerRes.json();
      console.info("[REGISTRATION] EIP-712: registration result", {
        status: result.status,
        txHash: result.txHash,
      });

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
      const message = logRegistrationFailure("EIP-712", err);
      setPaymentState("error");
      setEip712Step(null);
      onPaymentProcessing?.(false);

      if (message.includes("User rejected") || message.includes("denied")) {
        setErrorMessage("Signature rejected — you can try again when ready.");
      } else {
        setErrorMessage(message || "Payment failed — please try again.");
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
    email,
    emailReady,
    couponCode,
    onPaymentComplete,
    onPaymentProcessing,
    signMessageAsync,
  ]);

  // ── Free tier signup handler ──────────────────────────────────────────────
  const handleFreeSignup = useCallback(async () => {
    console.info("[REGISTRATION] handleFreeSignup start", {
      minerSlug,
      hlAddress: resolvedHlAddress,
      payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
      tierIndex,
      walletConnected: isConnected,
    });

    setPaymentState("processing");
    setEip712Step(isConnected ? "builderFee" : "provisioning");
    setErrorMessage("");
    onPaymentProcessing?.(true);

    try {
      let toltCustomerId = window.tolt_data?.customer_id || null;
      if (!toltCustomerId && window.tolt) {
        try {
          const result = await window.tolt.signup(resolvedHlAddress);
          toltCustomerId = result?.customer_id || window.tolt_data?.customer_id || null;
        } catch { /* tolt unavailable */ }
      }

      await runPreflight(
        {
          ...buildBaseRegisterBody({
            minerSlug,
            hlAddress: resolvedHlAddress,
            accountSize: selectedTier.accountSize,
            tierIndex,
            payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
            email: emailReady ? email : undefined,
          }),
          ...(isConnected && address ? { hlTransferSender: address } : {}),
        },
        couponCode,
      );

      // Builder fee approval — only if wallet is connected.
      if (isConnected && walletClient) {
        const previousChainId = chainId;
        const builderFeeResult = await ensureBuilderFeeApproved({
          address,
          chainId,
          switchChainAsync,
        });
        console.info("[REGISTRATION] Free: builder fee approval", builderFeeResult);
        if (previousChainId && previousChainId !== HL_SIGNING_CHAIN_ID) {
          switchChainAsync({ chainId: previousChainId }).catch(() => {});
        }
      }

      setEip712Step("provisioning");

      const freeRegisterBody = {
        ...buildBaseRegisterBody({
          minerSlug,
          hlAddress: resolvedHlAddress,
          accountSize: selectedTier.accountSize,
          tierIndex,
          payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
          email: emailReady ? email : undefined,
          toltCustomerId,
        }),
        paymentMethod: "free",
        ...(isConnected && address ? { hlTransferSender: address } : {}),
      };
      const { headers: freeOwnershipHeaders, body: freeSignedBody } =
        await signRegistrationRequest({
          path: "/api/register",
          body: freeRegisterBody,
          hlAddress: resolvedHlAddress,
          connectedAddress: address,
          signMessageAsync,
        });
      const registerRes = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...freeOwnershipHeaders,
          ...couponCodeHeader(couponCode),
        },
        body: freeSignedBody,
      });

      if (!registerRes.ok) {
        const data = await registerRes.json().catch(() => ({}));
        const err = new Error(
          data.error || data.message || "Registration failed. Please contact support.",
        );
        reportCritical(err, {
          source: "registration/free",
          userId: address || resolvedHlAddress,
          metadata: {
            step: "register_free",
            httpStatus: registerRes.status,
            serverError: data.error,
            serverMessage: data.message,
            minerSlug,
            hlAddress: resolvedHlAddress,
            payoutAddress: resolvedPayoutAddress || resolvedHlAddress,
            tierIndex,
          },
        });
        throw err;
      }

      const result = await registerRes.json();
      console.info("[REGISTRATION] Free: registration result", {
        status: result.status,
        txHash: result.txHash,
      });

      setPaymentState("success");
      setEip712Step(null);
      onPaymentProcessing?.(false);

      setTimeout(() => {
        onPaymentComplete({
          txHash: result.txHash || "",
          hlAddress: resolvedHlAddress,
          registrationStatus: result.status,
          paymentMethod: "free",
        });
      }, 1500);
    } catch (err) {
      const message = logRegistrationFailure("Free signup", err);
      setPaymentState("error");
      setEip712Step(null);
      onPaymentProcessing?.(false);

      if (message.includes("User rejected") || message.includes("denied")) {
        setErrorMessage("Signature rejected — you can try again when ready.");
      } else {
        setErrorMessage(message || "Signup failed — please try again.");
      }
    }
  }, [
    isConnected,
    walletClient,
    minerSlug,
    selectedTier,
    tierIndex,
    address,
    chainId,
    switchChainAsync,
    resolvedHlAddress,
    resolvedPayoutAddress,
    email,
    emailReady,
    couponCode,
    onPaymentComplete,
    onPaymentProcessing,
    signMessageAsync,
  ]);

  const ownershipReady = hlAddressReady && isConnected && walletMatchesHL;
  const baseOwnershipReady =
    hlAddressReady && isConnected && (walletMatchesHL || hlOwnershipBundleValid);
  const ownershipMismatchMsg =
    hlAddressReady && isConnected && !walletMatchesHL
      ? `Switch ${connectedWalletName} to ${truncateAddress(hlWallet)} (or click "Use connected" to register your current wallet)`
      : hlAddressReady && !isConnected
        ? "Connect the wallet whose HL address you're registering"
        : null;
  const baseOwnershipMismatchMsg =
    baseOwnershipReady
      ? null
      : paymentMethod === "base" && isConnected && !walletMatchesHL
        ? "Connect your Hyperliquid wallet to sign ownership before paying"
        : ownershipMismatchMsg;

  const canFreeSignup =
    promoReady &&
    hlAddressReady &&
    ownershipReady &&
    confirmed &&
    paymentState !== "processing";

  const canPayBase =
    promoReady &&
    isConnected &&
    isOnBase &&
    hasEnough &&
    hlAddressReady &&
    baseOwnershipReady &&
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const canPayEIP712 =
    promoReady &&
    isConnected &&
    hlHasEnough &&
    hlAddressReady &&
    ownershipReady &&
    confirmed &&
    !!paymentWallet &&
    paymentState !== "processing";

  const missingFieldBase = !hlAddressReady
    ? "Enter your Hyperliquid wallet address to continue"
    : baseOwnershipMismatchMsg
      ? baseOwnershipMismatchMsg
      : !confirmed
        ? "Confirm your details above to continue"
        : !promoReady && promoNeedsServer
          ? promoCheckingForCurrentInput
            ? "Validating promo…"
            : "Enter a valid promo code or clear the field"
          : !hasEnough
            ? "Insufficient USDC balance"
            : null;

  const missingFieldEIP712 = !hlAddressReady
    ? "Enter your Hyperliquid wallet address to continue"
    : ownershipMismatchMsg
      ? ownershipMismatchMsg
      : !confirmed
        ? "Confirm your details above to continue"
        : !promoReady && promoNeedsServer
          ? promoCheckingForCurrentInput
            ? "Validating promo…"
            : "Enter a valid promo code or clear the field"
          : hlBalanceLoading
            ? "Checking Hyperliquid balance..."
            : !hlHasEnough
              ? hlBalance != null
                ? "Insufficient USDC on Hyperliquid"
                : "Could not fetch Hyperliquid balance"
              : null;

  // ── Confirm phase: "Continue to review" readiness ──────────────────────────
  const paymentWalletReadyForContinue =
    isFree ||
    (paymentMethod === "base" && isConnected && isOnBase) ||
    (paymentMethod === "eip712" && isConnected);

  const canContinueToConfirm =
    promoReady &&
    hlAddressReady &&
    emailReady &&
    paymentMethod &&
    paymentWalletReadyForContinue &&
    (paymentMethod === "base" ? baseOwnershipReady : ownershipReady);

  const continueBlockerMsg = (() => {
    if (!hlAddressReady) {
      return "Enter your Hyperliquid wallet address to continue";
    }
    if (!emailReady) {
      return "Email address is required to continue";
    }
    if (!promoReady && promoNeedsServer) {
      return promoCheckingForCurrentInput
        ? "Validating promo…"
        : "Enter a valid promo code or clear the field to continue";
    }
    if (!paymentMethod) {
      return "Select a payment method to continue";
    }
    if (paymentMethod === "base") {
      if (!isConnected) {
        return "Connect a wallet to pay on Base";
      }
      if (!isOnBase) {
        return "Switch your wallet to the Base network to continue";
      }
      if (!baseOwnershipReady) {
        return baseOwnershipMismatchMsg ||
          "Connect your Hyperliquid wallet to verify ownership before continuing";
      }
      return null;
    }
    if (paymentMethod === "eip712") {
      if (!isConnected) {
        return "Connect the wallet that owns your Hyperliquid account";
      }
      if (!ownershipReady) {
        return ownershipMismatchMsg;
      }
    }
    return null;
  })();

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

          {emailReady && (
            <>
              <div className="border-t border-border" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-xs text-foreground break-all">{email}</p>
              </div>
            </>
          )}

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
              data-testid="confirm-details"
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

          {/* ── Free tier signup flow ── */}
          {isFree && paymentState !== "success" && paymentState !== "error" && (
            <div className="space-y-4">
              {paymentState === "idle" && (
                <Button
                  data-testid="free-signup"
                  onClick={handleFreeSignup}
                  disabled={!canFreeSignup}
                  aria-label={`Sign up for ${selectedTier.name} free account`}
                  className="w-full h-11 text-sm font-semibold cursor-pointer bg-teal-400 text-zinc-950 hover:bg-teal-400/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {!confirmed
                    ? "Confirm your details above to continue"
                    : !promoReady && promoNeedsServer
                      ? promoCheckingForCurrentInput
                        ? "Validating promo…"
                        : "Enter a valid promo code or clear the field"
                      : "Sign Up"}
                </Button>
              )}

              {paymentState === "processing" && (
                <div className="rounded-xl border border-border bg-zinc-900/50 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 pulse-teal shrink-0" />
                    <p className="text-sm font-semibold text-foreground">
                      {eip712Step === "builderFee" && "Preparing your account…"}
                      {eip712Step === "provisioning" && "Provisioning account…"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Base wallet payment flow ── */}
          {!isFree && paymentMethod === "base" && paymentState !== "success" && paymentState !== "error" && (
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
              onClick={() => {
                trackEvent("register_payment_submitted", {
                  tier_name: selectedTier?.name,
                  tier_price: price,
                  payment_method: "wallet",
                  ref_source: getRefSource(),
                  brand_variant: brandVariant,
                });
                handlePayBase();
              }}
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
          {!isFree && paymentMethod === "eip712" && paymentState !== "success" && paymentState !== "error" && (
            <div className="space-y-4">
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
                    onClick={() => {
                      trackEvent("register_payment_submitted", {
                        tier_name: selectedTier?.name,
                        tier_price: price,
                        payment_method: "hyperliquid",
                        ref_source: getRefSource(),
                        brand_variant: brandVariant,
                      });
                      handlePayEIP712();
                    }}
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
                      {eip712Step === "builderFee" && "Preparing your account\u2026"}
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
          <span
            className={
              showPromoDiscountLine
                ? "text-muted-foreground font-bold font-mono line-through decoration-muted-foreground"
                : "text-teal-400 font-bold font-mono"
            }
          >
            ${challengeFeeBasisUsd}
          </span>
        </div>

        {showPromoDiscountLine ? (
          <div
            data-testid="order-promo-line"
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">Promo ({promoCodeUpperDisplay})</span>
            <span className="font-mono font-semibold text-teal-400">
              −$
              {Number.isInteger(promoDiscountUsd)
                ? promoDiscountUsd
                : promoDiscountUsd.toFixed(2)}
            </span>
          </div>
        ) : null}

        {!isFree && <div className="border-t border-border" />}

        <div className="flex items-center justify-between">
          <span className="font-bold">Total</span>
          <span
            data-testid="order-total"
            className="text-xl font-bold font-mono text-teal-400"
          >
            {isFree ? (
              "Free"
            ) : (
              <>
                ${price}{" "}
                <span className="text-sm font-semibold text-muted-foreground">USDC</span>
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-muted-foreground text-balance">
          {formatRulesSummary(selectedTier.details)}
        </p>
      </div>

      <div className="w-full max-w-lg mt-6 space-y-1.5">
        <label htmlFor="reg-promo" className="text-xs font-medium text-muted-foreground">
          Promo code <span className="text-muted-foreground/60 font-normal">(optional)</span>
        </label>
        <input
          id="reg-promo"
          data-testid="reg-promo"
          type="text"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase());
            setConfirmed(false);
          }}
          placeholder="E.g. SUMMER25"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={promoFieldErrorMsg ? "true" : undefined}
          aria-describedby="promo-hint"
          className={`
            w-full rounded-xl border bg-card p-4 text-sm font-mono tracking-wide uppercase
            placeholder:text-muted-foreground/50 placeholder:normal-case placeholder:tracking-normal
            outline-none
            focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
            transition-[border-color,box-shadow] duration-200
            ${promoFieldErrorMsg ? "border-destructive" : "border-border hover:border-white/[0.15]"}
          `}
        />
        <p
          id="promo-hint"
          role={promoFieldErrorMsg ? "alert" : undefined}
          className={
            promoFieldErrorMsg
              ? "text-xs text-destructive"
              : promoCheckingForCurrentInput
                ? "text-xs text-muted-foreground"
                : "text-xs text-muted-foreground/60"
          }
        >
          {promoFieldErrorMsg
            ? promoFieldErrorMsg
            : promoCheckingForCurrentInput
              ? "Checking promo…"
              : "Clearing the field removes the discount."}
        </p>
      </div>

      <div className="w-full max-w-lg mt-4 space-y-1.5">
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
              data-testid="hl-wallet-change"
              onClick={() => {
                setEditingHlWallet(true);
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
                hlConnectTargetRef.current = null;
                setConfirmed(false);
              }}
              onFocus={() => handleHelpFocus("hl-wallet")}
              onBlur={() => {
                setHlWalletTouched(true);
                if (hlWalletValid) setEditingHlWallet(false);
                handleHelpBlur();
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

        {hlAddressReady && !isConnected && isFree && (
          <div
            data-testid="wallet-ownership-connect-banner"
            className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 mt-2 flex items-start gap-2.5"
          >
            <Warning size={16} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                Connect a wallet to continue
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;re registering{" "}
                <span className="font-mono text-foreground">{truncateAddress(hlWallet)}</span>
                . Connect the wallet that owns this Hyperliquid address so we can
                sign and prove ownership.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <button
                      type="button"
                      onClick={() => openConnectModal?.()}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400 inline-flex items-center gap-1.5"
                    >
                      <Wallet size={14} weight="bold" />
                      Connect wallet
                    </button>
                  )}
                </ConnectButton.Custom>
              </div>
            </div>
          </div>
        )}
        {showHlOwnershipMismatchBanner && (
          <div
            data-testid="wallet-ownership-mismatch-banner"
            className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-3.5 mt-2 flex items-start gap-2.5"
          >
            <Warning size={16} weight="fill" className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                Wallet doesn&apos;t match
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;re registering{" "}
                <span className="font-mono text-foreground">{truncateAddress(hlWallet)}</span>
                {bannerConnectedAddress ? (
                  <>
                    {" "}but {connectedWalletName} is connected as{" "}
                    <span className="font-mono text-foreground">
                      {truncateAddress(bannerConnectedAddress)}
                    </span>
                    . We need a signature from the HL address itself to prove ownership.
                  </>
                ) : (
                  <>
                    . Connect the wallet that owns this address to verify ownership.
                  </>
                )}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {(paymentMethod === "eip712" || isFree) && bannerConnectedAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setHlWallet(bannerConnectedAddress);
                      setHlWalletTouched(true);
                      setEditingHlWallet(false);
                      setConfirmed(false);
                      setHlMismatchReconnecting(false);
                      hlConnectTargetRef.current = null;
                    }}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    Use {truncateAddress(bannerConnectedAddress)} instead
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConnectDifferentHlWallet}
                  className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                >
                  Connect a different wallet
                </button>
              </div>
            </div>
          </div>
        )}
        {!hlWalletValid && (
          <a
            href={HYPERLIQUID_SIGNUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-teal-400/20 bg-teal-400/[0.04] p-4 mt-1 transition-[border-color,background-color] duration-200 hover:border-teal-400/40 hover:bg-teal-400/[0.07] outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-400/10">
                <ArrowSquareOut size={20} weight="duotone" className="text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  New to Hyperliquid?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sign up and get <span className="text-teal-400 font-semibold">4% off fees</span> on your first $25M in volume
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-teal-400/10 text-xs font-semibold text-teal-400 group-hover:bg-teal-400/20 transition-[background-color] duration-200">
                Sign up
                <ArrowSquareOut size={12} weight="bold" />
              </span>
            </div>
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      {/* ─── 2. Email ─── */}
      {/* Hyperstack (bitcast): mandatory email popup instead of an inline field. */}
      {isEmailPopupBrand && phase === "connect" && !emailReady && (
        <HyperstackEmailPopup
          portalId={hsPortalId}
          formId={hsFormId}
          onCaptured={handleEmailCaptured}
        />
      )}
      {!isEmailPopupBrand && (
      <div className="w-full max-w-lg mt-4 space-y-1.5">
        <label htmlFor={isHubspotBrand ? undefined : "reg-email"} className="text-xs font-medium text-muted-foreground">
          Email address <span className="text-destructive">*</span>
        </label>

        {isHubspotBrand ? (
          <div
            id="hubspot-email-form"
            ref={hubspotFormContainerRef}
            className={`hubspot-email-wrapper ${
              hubspotFormReady ? "hubspot-email-wrapper--ready" : ""
            } ${showEmailError ? "hubspot-email-wrapper--error" : ""}`}
            aria-invalid={showEmailError ? "true" : undefined}
            aria-describedby="email-hint email-error"
            aria-busy={!hubspotFormReady ? "true" : undefined}
          />
        ) : (
          <input
            id="reg-email"
            data-testid="reg-email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="you@example.com"
            aria-label="Email address for registration updates"
            aria-describedby="email-hint email-error"
            aria-invalid={showEmailError ? "true" : undefined}
            aria-required="true"
            className={`
              w-full rounded-xl border bg-card p-4 text-sm
              placeholder:text-muted-foreground/50
              outline-none
              focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background
              transition-[border-color,box-shadow] duration-200
              ${showEmailError ? "border-destructive" : "border-border hover:border-white/[0.15]"}
            `}
          />
        )}

        <div id="email-error" role="alert" className="min-h-[1.25rem]">
          {showEmailError && (
            <p className="text-xs text-destructive">
              {email.length === 0
                ? "Email address is required"
                : "Enter a valid email address"}
            </p>
          )}
        </div>
        <p id="email-hint" className="text-xs text-muted-foreground/60">
          We&#8217;ll send registration confirmation and account updates here
        </p>
      </div>
      )}

      {/* ─── 3. Payment Method Selector (hidden for free tier) ─── */}
      {!isFree && (
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
                  <p className="text-sm font-semibold text-foreground">Pay with Hyperliquid</p>
                  <p className="text-xs text-muted-foreground">USDC from trading account</p>
                  <span className="mt-1.5 inline-block text-[11px] leading-none font-semibold uppercase tracking-wide text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">Recommended</span>
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

        {paymentMethod === "eip712" && (
          <p className="text-xs text-muted-foreground text-balance">
            Your connected wallet must own the Hyperliquid account. Only withdrawable USDC is&nbsp;available — funds in open positions are&nbsp;excluded.
          </p>
        )}
      </div>
      )}

      {/* ─── 4. Wallet Connection (for eip712/base) ─── */}
      {!isFree && paymentMethod && (paymentMethod === "eip712" || paymentMethod === "base") && !isConnected && (
        <div className="w-full max-w-lg mt-4 space-y-4 text-center">
          <p className="text-sm text-muted-foreground text-balance max-w-md mx-auto">
            {paymentMethod === "base"
              ? <>Connect the wallet you&#8217;ll use to pay with USDC on&nbsp;Base.</>
              : "Connect the wallet that owns your Hyperliquid account to sign and transfer USDC."}
          </p>
          {paymentMethod === "eip712" ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleConnectForEip712}
                className="shiny-cta h-11 px-8 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck size={18} weight="bold" />
                  Connect Wallet
                </span>
              </button>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* Wallet connected indicator */}
      {!isFree && paymentMethod && (paymentMethod === "eip712" || paymentMethod === "base") && isConnected && (
        <div className="w-full max-w-lg mt-4">
          <div className="rounded-xl border border-border bg-zinc-900/50 px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
              <span className="text-sm font-mono text-foreground truncate">
                {truncateAddress(address)}
              </span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Connected
              </span>
            </div>
            <button
              type="button"
              data-testid="connected-wallet-change"
              disabled={signingOwnership}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  paymentMethod === "base" &&
                  walletMatchesHL &&
                  hlAddressReady
                ) {
                  setConfirmed(false);
                  if (paymentState === "error") {
                    setPaymentState("idle");
                    setErrorMessage("");
                  }
                  await handleUseDifferentPayingWallet();
                  return;
                }
                setConfirmed(false);
                if (paymentState === "error") {
                  setPaymentState("idle");
                  setErrorMessage("");
                }
                armConnectDraft();
                await withReloadSuppressed(async () => {
                  try {
                    await disconnectAsync();
                  } catch {
                    /* already disconnected */
                  }
                });
                setPendingReconnect(true);
              }}
              className="shrink-0 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-[border-color,color] duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Change connected wallet"
            >
              {signingOwnership ? "Signing…" : "Change"}
            </button>
          </div>

        </div>
      )}

      {/* Base: switch chain if needed */}
      {paymentMethod === "base" && isConnected && !isOnBase && (
        <div className="w-full max-w-lg mt-4">
          <Button
            onClick={() => {
              try {
                switchChain(
                  { chainId: BASE_CHAIN_ID },
                  {
                    onError: (err) => {
                      const msg = err?.message || "";
                      if (
                        msg.includes("not supported") ||
                        msg.includes("Unrecognized chain") ||
                        msg.includes("unknown chain") ||
                        msg.includes("addEthereumChain") ||
                        err?.code === 4902
                      ) {
                        setErrorMessage(
                          `Your wallet doesn't support ${CHAIN_LABEL}. Please switch to a wallet that supports Base (e.g. MetaMask, Rabby, or Coinbase Wallet).`
                        );
                      } else {
                        setErrorMessage(err.message || "Failed to switch network.");
                      }
                    },
                  }
                );
              } catch (e) {
                setErrorMessage(e.message || "Failed to switch network.");
              }
            }}
            className="w-full h-11 text-sm font-semibold bg-teal-400 text-zinc-950 hover:bg-teal-400/90 cursor-pointer"
          >
            Switch to {CHAIN_LABEL}
          </Button>
          {errorMessage && (
            <p role="alert" className="text-sm text-destructive mt-2">
              {errorMessage}
            </p>
          )}
        </div>
      )}

      {/* ─── 5. Payout Wallet (shown after payment method selected or for free tier) ─── */}
      {(isFree || paymentMethod) && hlAddressReady && (
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

      {/* ─── Continue to Review ─── */}
      <div className="w-full max-w-lg mt-6">
        <Button
          data-testid="continue-to-review"
          onClick={() => {
            if (!payoutPrefilled && hlAddressReady) {
              setPayoutWallet(hlWallet);
              setPayoutPrefilled(true);
            }
            // Submit email to HubSpot via Forms API (fire-and-forget)
            if (isHubspotBrand && email && isValidEmail(email)) {
              fetch(`https://api.hsforms.com/submissions/v3/integration/submit/${hsPortalId}/${hsFormId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fields: [{ name: "email", value: email }],
                  context: {
                    pageUri: window.location.href,
                    pageName: document.title,
                  },
                }),
              }).catch(() => { /* non-blocking */ });
            }
            trackEvent("register_review_reached", {
              tier_name: selectedTier?.name,
              payment_method: paymentMethod === "base" ? "wallet" : "hyperliquid",
              ref_source: getRefSource(),
              brand_variant: brandVariant,
            });
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

        {!canContinueToConfirm && continueBlockerMsg && (
          <p className="text-xs text-muted-foreground/70 text-center mt-2">
            {continueBlockerMsg}
          </p>
        )}
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
