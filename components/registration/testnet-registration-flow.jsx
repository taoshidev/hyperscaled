"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Copy,
  Check,
  GoogleChromeLogo,
  Flask,
  EnvelopeSimple,
  Wallet,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Stepper } from "./stepper";
import { isValidEmail, isValidHLAddress } from "@/lib/validation";
import { copyToClipboard, cn } from "@/lib/utils";
import { truncateAddress, formatAccountSize } from "@/lib/format";
import ExtensionModal from "@/components/marketing/ExtensionModal";
import { reportError } from "@/lib/errors";

const STEP_LABELS = ["Account Size", "Your Info", "Confirmation"];

// ─── CopyButton ───

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
      className="ml-2 p-1 min-h-11 min-w-11 inline-flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-[color] duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {copied ? (
        <Check size={14} weight="bold" className="text-teal-400" />
      ) : (
        <Copy size={14} weight="bold" />
      )}
    </button>
  );
}

// ─── Step 0: Account size selection ───

function StepSelectSize({ tiers, selectedTier, onSelect, onContinue }) {
  const cardRefs = useRef([]);

  const handleKeyDown = useCallback(
    (e, tier, index) => {
      if (!tiers) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelect(tier, index);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = (index + 1) % tiers.length;
        cardRefs.current[next]?.focus();
        onSelect(tiers[next], next);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = (index - 1 + tiers.length) % tiers.length;
        cardRefs.current[prev]?.focus();
        onSelect(tiers[prev], prev);
      }
    },
    [onSelect, tiers],
  );

  return (
    <div className="flex flex-col">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-400 text-sm font-medium px-4 py-2 rounded-lg border border-amber-400/20">
          <Flask size={14} weight="fill" />
          Testnet — no payment required
        </span>
      </div>

      <div className="text-center space-y-2 mt-4">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Choose your testnet account size
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto text-balance">
          All testnet accounts are free. Pick the size you want to trade with.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Choose your testnet account size"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-10"
      >
        {!tiers
          ? [0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton rounded-2xl h-56" />)
          : tiers.map((tier, i) => {
              const isSelected = selectedTier?.accountSize === tier.accountSize;
              const isPopular = tier.accountSize === 50000;

              return (
                <div
                  key={tier.accountSize}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${formatAccountSize(tier.accountSize)} testnet account — free`}
                  tabIndex={isSelected || (!selectedTier && i === 0) ? 0 : -1}
                  onClick={() => onSelect(tier, i)}
                  onKeyDown={(e) => handleKeyDown(e, tier, i)}
                  style={{ animationDelay: `${i * 80}ms` }}
                  className={cn(
                    "relative cursor-pointer rounded-2xl p-6 group text-card-foreground",
                    "transition-[border-color,box-shadow,transform,opacity] duration-200",
                    "animate-[fadeInUp_0.35s_ease-out_both]",
                    "outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isSelected
                      ? "shiny-border"
                      : cn(
                          "border bg-zinc-900/50",
                          isPopular
                            ? "border-white/[0.15] hover:border-white/[0.20]"
                            : "border-white/[0.06] hover:border-white/[0.10]",
                        ),
                    selectedTier && !isSelected ? "opacity-70" : "",
                    isPopular ? "md:scale-[1.02] md:z-10" : "",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl pointer-events-none transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    )}
                    style={{ background: "radial-gradient(circle at 20% 20%, rgba(0,198,167,0.06), transparent 60%)" }}
                  />

                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-amber-400 text-zinc-950">
                        <Flask size={11} weight="fill" />
                        Popular
                      </span>
                    </div>
                  )}

                  <div className={isPopular ? "mt-2" : ""}>
                    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Testnet
                    </span>
                  </div>

                  <div className="text-lg font-semibold text-white mt-1">
                    {formatAccountSize(tier.accountSize)} Account
                  </div>

                  <div className="flex items-baseline gap-2 mt-3 mb-5">
                    <span className="text-3xl font-bold font-mono text-white">Free</span>
                    <span className="text-xs text-zinc-500 font-medium">testnet</span>
                  </div>

                  <div className="border-t border-border mb-4" />

                  <div className="space-y-2.5">
                    {(tier.details || []).map((detail) => (
                      <div key={detail.label} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">{detail.label}</span>
                        <span className="text-foreground font-medium font-mono">{detail.value}</span>
                      </div>
                    ))}
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                      <Check size={12} weight="bold" className="text-zinc-950" />
                    </div>
                  )}
                </div>
              );
            })}
      </div>

      <div className="flex justify-center mt-8">
        {selectedTier ? (
          <button
            type="button"
            onClick={onContinue}
            className="shiny-cta h-11 px-8 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
              Continue
              <ArrowRight size={15} weight="bold" />
            </span>
          </button>
        ) : (
          <Button
            disabled
            className="px-8 h-11 text-sm font-semibold bg-muted text-muted-foreground cursor-not-allowed"
          >
            Continue
            <ArrowRight size={15} weight="bold" className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── FormField ───

function FormField({ id, label, icon: Icon, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Icon size={14} className="text-muted-foreground" />
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Step 1: Info form ───

function StepInfo({ selectedTier, onSubmit, onBack }) {
  const [email, setEmail] = useState("");
  const [hlAddress, setHlAddress] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      next.email = "Enter a valid email address.";
    }
    if (!hlAddress.trim()) {
      next.hlAddress = "Hyperliquid address is required.";
    } else if (!isValidHLAddress(hlAddress.trim())) {
      next.hlAddress = "Enter a valid 0x wallet address (42 characters).";
    }
    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    setErrors({});
    setApiError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/testnet-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hlAddress: hlAddress.trim(),
          email: email.trim(),
          accountSize: selectedTier.accountSize,
          tierIndex: selectedTier.tierIndex,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error || "Registration failed. Please try again.");
        setSubmitting(false);
        reportError(new Error("testnet_register_failed"), {
          source: "registration/testnet",
          metadata: {
            step: "testnet_register",
            httpStatus: res.status,
            serverError: data.error,
            hlAddress: hlAddress.trim(),
            accountSize: selectedTier.accountSize,
            tierIndex: selectedTier.tierIndex,
          },
        });
        return;
      }

      onSubmit({
        email: email.trim(),
        hlAddress: hlAddress.trim(),
        registrationStatus: data.status,
      });
    } catch (err) {
      setApiError("Network error. Please check your connection and try again.");
      setSubmitting(false);
      reportError(err, {
        source: "registration/testnet",
        metadata: {
          step: "testnet_register_network",
          hlAddress: hlAddress.trim(),
          accountSize: selectedTier.accountSize,
          tierIndex: selectedTier.tierIndex,
        },
      });
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-400 text-sm font-medium px-4 py-2 rounded-lg border border-amber-400/20">
          <Flask size={14} weight="fill" />
          {formatAccountSize(selectedTier.accountSize)} Testnet Account
        </span>
      </div>

      <div className="text-center space-y-2 mt-4">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Enter your details
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto text-balance">
          No wallet signature or payment required.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 w-full max-w-lg mx-auto flex flex-col gap-5"
      >
        <FormField
          id="email"
          label="Email address"
          icon={EnvelopeSimple}
          error={errors.email}
        >
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => {
              if (!email.trim()) setErrors((p) => ({ ...p, email: "Email is required." }));
              else if (!isValidEmail(email)) setErrors((p) => ({ ...p, email: "Enter a valid email address." }));
              else setErrors((p) => { const n = { ...p }; delete n.email; return n; });
            }}
            placeholder="you@example.com"
            autoComplete="email"
            className={cn(
              "h-11 w-full rounded-lg border bg-zinc-900/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50",
              "transition-[border-color,box-shadow] duration-200",
              "outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              errors.email ? "border-destructive" : "border-border hover:border-white/20",
            )}
          />
        </FormField>

        <FormField
          id="hlAddress"
          label="Hyperliquid wallet address"
          icon={Wallet}
          error={errors.hlAddress}
          hint="Your Hyperliquid EVM address — testnet funds will be allocated here."
        >
          <input
            id="hlAddress"
            type="text"
            value={hlAddress}
            onChange={(e) => setHlAddress(e.target.value)}
            onBlur={() => {
              const v = hlAddress.trim();
              if (!v) setErrors((p) => ({ ...p, hlAddress: "Hyperliquid address is required." }));
              else if (!isValidHLAddress(v)) setErrors((p) => ({ ...p, hlAddress: "Enter a valid 0x wallet address (42 characters)." }));
              else setErrors((p) => { const n = { ...p }; delete n.hlAddress; return n; });
            }}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "h-11 w-full rounded-lg border bg-zinc-900/50 px-4 text-sm font-mono text-foreground placeholder:text-muted-foreground/50",
              "transition-[border-color,box-shadow] duration-200",
              "outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              errors.hlAddress ? "border-destructive" : "border-border hover:border-white/20",
            )}
          />
        </FormField>

        {apiError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <WarningCircle size={16} weight="fill" className="text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{apiError}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 min-h-11 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            <ArrowLeft size={14} weight="bold" />
            Back
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="shiny-cta h-11 px-10 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
              {submitting ? "Registering…" : "Register for Testnet"}
              {!submitting && <ArrowRight size={15} weight="bold" />}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Step 2: Confirmation ───

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function StepConfirmation({ selectedTier, email, hlAddress, registrationStatus }) {
  const isRegistered = registrationStatus === "registered";
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col"
    >
      <motion.div
        variants={itemVariants}
        className="w-full max-w-lg mx-auto flex flex-col items-center"
      >
        <div className="flex items-start gap-3 self-start sm:self-center">
          <CheckCircle size={40} weight="fill" className="text-teal-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight leading-tight text-balance">
              You&#8217;re registered on testnet.
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRegistered
                ? "Your testnet account is ready."
                : "Your account is being provisioned. We\u2019ll follow up at " + email + "."}
            </p>
          </div>
        </div>

        <div className="w-full rounded-xl border border-border bg-zinc-900/50 px-5 pt-4 pb-px mt-8">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Account size</span>
            <span className="text-sm font-semibold font-mono">
              {formatAccountSize(selectedTier.accountSize)}
            </span>
          </div>
          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-mono text-foreground">{email}</span>
          </div>
          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Wallet</span>
            <div className="flex items-center">
              <span className="text-sm font-mono text-foreground">{truncateAddress(hlAddress)}</span>
              <CopyButton text={hlAddress} label="Copy wallet address" />
            </div>
          </div>
          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Network</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-400">
              <Flask size={13} weight="fill" />
              Testnet
            </span>
          </div>
          <div className="border-t border-border" />

          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-muted-foreground">Status</span>
            <div className="flex items-center gap-2">
              {isRegistered ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                  <span className="text-sm text-teal-400">Registered</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-teal-400 pulse-teal shrink-0" />
                  <span className="text-sm text-foreground">Provisioning…</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col items-center mt-10 gap-4">
          <h3 className="text-lg font-bold tracking-tight text-foreground text-balance text-center">
            Install the Chrome extension to start&nbsp;trading
          </h3>
          <p className="text-sm text-muted-foreground text-balance text-center max-w-md">
            The extension tracks your positions, enforces risk limits, and displays your progress inside Hyperliquid.
          </p>
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = '/hyperscaled_extension.zip';
              a.download = 'hyperscaled_extension.zip';
              a.click();
              setExtensionModalOpen(true);
            }}
            className="shiny-cta h-11 w-full max-w-sm flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <GoogleChromeLogo size={18} weight="bold" />
              Install Chrome Extension
            </span>
          </button>
          <p className="text-xs text-muted-foreground">Available for Chrome and Brave</p>
          <ExtensionModal open={extensionModalOpen} onClose={() => setExtensionModalOpen(false)} />
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-[color] duration-200 min-h-11 mt-2"
        >
          Go to Dashboard
          <ArrowRight size={14} weight="bold" />
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ─── Main flow ───

export function TestnetRegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [tiers, setTiers] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    fetch("/api/miners/vanta")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((data) => setTiers(data.tiers))
      .catch((err) => {
        console.warn("[TestnetRegistrationFlow] Failed to load tiers:", err);
        setTiers([]);
      });
  }, []);

  function handleSelectTier(tier, index) {
    setSelectedTier({ ...tier, tierIndex: index });
  }

  function handleInfoSubmit(data) {
    setFormData(data);
    setCurrentStep(2);
  }

  return (
    <main className="min-h-[100dvh] flex flex-col">
      <nav className="flex items-center justify-between py-4 px-6 w-full max-w-3xl mx-auto">
        <Link
          href="/"
          className="outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
        >
          <img src="/hyperscaled-logo.svg" alt="Hyperscaled" className="h-7 w-auto" />
        </Link>
        <Link href="/">
          <Button
            variant="outline"
            className="text-sm h-11 border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 cursor-pointer"
          >
            Exit
          </Button>
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-start pt-6 pb-20 px-4">
        <div className="w-full max-w-3xl">
          {currentStep === 2 ? (
            <div className="mb-10 flex justify-center">
              <p className="text-sm font-medium text-teal-400">Registration complete</p>
            </div>
          ) : (
            <Stepper currentStep={currentStep} steps={STEP_LABELS} />
          )}

          {currentStep === 0 && (
            <StepSelectSize
              tiers={tiers}
              selectedTier={selectedTier}
              onSelect={handleSelectTier}
              onContinue={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 1 && selectedTier && (
            <StepInfo
              selectedTier={selectedTier}
              onSubmit={handleInfoSubmit}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {currentStep === 2 && formData && (
            <StepConfirmation
              selectedTier={selectedTier}
              email={formData.email}
              hlAddress={formData.hlAddress}
              registrationStatus={formData.registrationStatus}
            />
          )}
        </div>
      </div>
    </main>
  );
}
