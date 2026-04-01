"use client";

import { useState } from "react";

/* ── Shared visual building blocks matching the widget design ────────────── */

function Tip({ label, children }) {
  return (
    <div className="rounded-[0.625rem] border border-[oklch(0.5_0.15_160/25%)] bg-[oklch(0.5_0.15_160/8%)] px-3 py-2.5 my-2.5">
      {label && (
        <strong className="block text-[11px] font-semibold uppercase tracking-[0.6px] text-teal-400 mb-1.5">
          {label}
        </strong>
      )}
      <div className="text-[13px] text-muted-foreground leading-relaxed [&_p]:m-0">
        {children}
      </div>
    </div>
  );
}

function Warn({ label, children }) {
  return (
    <div className="rounded-[0.625rem] border border-[oklch(0.6_0.16_60/30%)] bg-[oklch(0.6_0.16_60/8%)] px-3 py-2.5 my-2.5">
      {label && (
        <strong className="block text-[11px] font-semibold uppercase tracking-[0.6px] text-[oklch(0.75_0.12_60)] mb-1">
          {label}
        </strong>
      )}
      <div className="text-[13px] text-muted-foreground leading-relaxed [&_p]:m-0 [&_p+p]:mt-2">
        {children}
      </div>
    </div>
  );
}

function Steps({ children }) {
  return (
    <ol className="list-none p-0 my-2 space-y-1.5 counter-reset-[hw-step]">
      {children}
    </ol>
  );
}

function Step({ children }) {
  return (
    <li className="flex items-start gap-2 text-[13px] text-muted-foreground leading-relaxed">
      <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-[oklch(0.2_0_0)] border border-[oklch(1_0_0/10%)] text-teal-400 text-[10px] font-bold shrink-0 mt-0.5">
        {/* Number injected via CSS counter or manually */}
      </span>
      <span>{children}</span>
    </li>
  );
}

/* Numbered steps — auto-numbered via array index */
function NumberedSteps({ items }) {
  return (
    <ol className="list-none p-0 my-2 space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground leading-relaxed">
          <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-[oklch(0.2_0_0)] border border-[oklch(1_0_0/10%)] text-teal-400 text-[10px] font-bold shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Code({ children }) {
  return (
    <code className="font-mono text-xs bg-[oklch(0.2_0_0)] border border-[oklch(1_0_0/10%)] rounded px-1.5 py-px text-teal-400">
      {children}
    </code>
  );
}

function Tags({ items }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="bg-[oklch(0.2_0_0)] border border-[oklch(1_0_0/10%)] rounded px-2 py-0.5 text-xs text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Label({ children }) {
  return (
    <h4 className="text-[11px] font-semibold uppercase tracking-[0.6px] text-muted-foreground mt-3 mb-1.5">
      {children}
    </h4>
  );
}

function MethodPills({ methods, activeMethod, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-2">
      {methods.map((m) => (
        <button
          key={m.key}
          type="button"
          onClick={() => onSelect(m.key)}
          className={`
            rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer
            border transition-[background-color,border-color,color] duration-150
            outline-none focus-visible:ring-2 focus-visible:ring-teal-400
            focus-visible:ring-offset-2 focus-visible:ring-offset-background
            ${activeMethod === m.key
              ? "bg-[oklch(0.5_0.15_160/10%)] border-[oklch(0.5_0.15_160/35%)] text-teal-400"
              : "bg-[oklch(0.2_0_0)] border-[oklch(1_0_0/10%)] text-muted-foreground hover:bg-[oklch(0.5_0.15_160/10%)] hover:border-[oklch(0.5_0.15_160/35%)] hover:text-teal-400"
            }
          `}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

/* ── Payment wallet content with interactive method pills ───────────────── */

function PaymentWalletContent() {
  const [method, setMethod] = useState("coinbase");

  return (
    <>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
        Pays with <strong className="text-foreground font-semibold">USDC on the Base network</strong> from
        a self-custody wallet. Your wallet connects automatically when you select this option.
      </p>

      <Tip label="Supported wallets">
        <Tags items={["MetaMask", "Coinbase Wallet", "Rainbow", "Rabby", "Any WalletConnect wallet"]} />
      </Tip>

      <Label>Don&rsquo;t have USDC on Base?</Label>

      <MethodPills
        methods={[
          { key: "coinbase", label: "Coinbase" },
          { key: "bridge", label: "Bridge" },
          { key: "swap", label: "Swap" },
        ]}
        activeMethod={method}
        onSelect={setMethod}
      />

      {method === "coinbase" && (
        <NumberedSteps
          items={[
            "Buy USDC on Coinbase",
            <>Send → choose <strong className="text-foreground font-semibold">Base</strong> network</>,
            "Enter your wallet address and confirm",
          ]}
        />
      )}
      {method === "bridge" && (
        <NumberedSteps
          items={[
            <>Go to <a href="https://bridge.base.org" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">bridge.base.org</a></>,
            "Bridge USDC from Ethereum → Base",
            "Wait ~2 minutes for confirmation",
          ]}
        />
      )}
      {method === "swap" && (
        <NumberedSteps
          items={[
            <>Switch your wallet to <strong className="text-foreground font-semibold">Base network</strong></>,
            "Visit Uniswap or Aerodrome",
            "Swap any Base token for USDC",
          ]}
        />
      )}

    </>
  );
}

/* ── Help content map ───────────────────────────────────────────────────── */

export const HELP_CONTENT = {
  default: {
    icon: null,
    title: "Getting Started",
    content: (
      <>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
          You&rsquo;re a few steps away from mirroring your Hyperliquid trades to a{" "}
          <strong className="text-foreground font-semibold">Hyperscaled account</strong> — pass the
          challenge and unlock a scaled account with 100% performance rewards.
        </p>
        <Tip label="Fastest path (existing HL user)">
          <NumberedSteps
            items={[
              "Install the Hyperscaled Chrome extension",
              "Log into your Hyperliquid account",
              <>Fill in this form and choose <strong className="text-foreground font-semibold">Pay with Hyperliquid</strong></>,
              "Start trading — your trades are mirrored automatically",
            ]}
          />
        </Tip>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          New to Hyperliquid or crypto? Each field below has its own guidance — just click on it.
        </p>
      </>
    ),
  },

  email: {
    icon: null,
    title: "Email Address",
    content: (
      <>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
          Enter the email address you&rsquo;d like to use for your Hyperscaled account.
          This is separate from your Hyperliquid login.
        </p>
        <Tip label="What this email is used for">
          <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[13px] text-muted-foreground">
            <li>Registration confirmation</li>
            <li>Trade mirroring notifications</li>
            <li>Drawdown and performance alerts</li>
            <li>Payout notifications when you pass the challenge</li>
          </ul>
        </Tip>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Use an email you check regularly — drawdown alerts are time-sensitive.
        </p>
      </>
    ),
  },

  "hl-wallet": {
    icon: null,
    title: "Hyperliquid Wallet Address",
    content: (
      <>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
          This is the <strong className="text-foreground font-semibold">wallet address you trade from on
          Hyperliquid</strong> — it starts with <Code>0x</Code>. Hyperscaled monitors
          this address on-chain and mirrors every trade proportionally to your
          Hyperscaled account.
        </p>

        <Warn label="Use your active trading address">
          <p>
            Enter the address you actually place trades from. A deposit-only or
            inactive address won&rsquo;t generate any mirrored trades. You can register a
            subaccount address for mirroring, but{" "}
            <strong className="text-foreground font-semibold">payment must come from your HL main
            wallet</strong> — Hyperliquid only allows sending funds from the main account.
          </p>
        </Warn>

        <Label>How to find your address</Label>
        <NumberedSteps
          items={[
            <>Go to <a href="https://app.hyperliquid.xyz" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">app.hyperliquid.xyz</a></>,
            "Connect your wallet (or log in if already connected)",
            <>Your address appears in the <strong className="text-foreground font-semibold">top-right corner</strong></>,
            <>Click it to copy — it starts with <Code>0x</Code></>,
            "Paste it here",
          ]}
        />

        <Tip label="This is also your payout address">
          <p>
            By default, challenge rewards are sent to this same address. You can
            update your payout address in the dashboard after registration.
          </p>
        </Tip>

      </>
    ),
  },

  "payment-base": {
    icon: null,
    title: "Pay with Wallet",
    content: <PaymentWalletContent />,
  },

  "payment-hl": {
    icon: null,
    title: "Pay with Hyperliquid",
    content: (
      <>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
          Transfers the challenge fee as USDC{" "}
          <strong className="text-foreground font-semibold">directly from your Hyperliquid account
          balance</strong>. This is the fastest and simplest option — no external
          wallet or bridging needed.
        </p>

        <Tip label="How it works">
          <NumberedSteps
            items={[
              <>Select <strong className="text-foreground font-semibold">Pay with Hyperliquid</strong></>,
              "Make sure your HL wallet address is entered above",
              "Hyperscaled initiates a USDC transfer from your HL account",
              "Approve it in your HL interface — registration completes instantly",
            ]}
          />
        </Tip>

        <Warn label="Balance check">
          <p>
            Your USDC must be in your HL account balance — not locked in open
            positions. Close or reduce positions if needed to free up the balance.
          </p>
          <p>
            <strong className="text-foreground font-semibold">Use your HL main wallet to pay.</strong>{" "}
            Hyperliquid only allows sending funds from the main account — you cannot
            pay from a subaccount.
          </p>
        </Warn>

        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Don&rsquo;t have USDC in your HL account yet? You can deposit from
          Coinbase or bridge from another network.
        </p>
      </>
    ),
  },

  "payout-wallet": {
    icon: null,
    title: "Payout Wallet",
    content: (
      <>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-2">
          When you trade profitably on your funded account, your share of the
          profits is calculated and sent directly to this wallet —{" "}
          <strong className="text-foreground font-semibold">automatically, with no manual withdrawal
          needed</strong>. Every payout cycle, earned profits land here.
        </p>

        <Tip label="Default address">
          <p>
            This is prefilled with your Hyperliquid trading address, but you can
            change it to any Ethereum-compatible address — a hardware wallet, a
            different hot wallet, or wherever you prefer to receive funds.
          </p>
        </Tip>

        <Tip label="When do payouts happen?">
          <p>
            Payouts are processed at the end of each payout cycle once you pass the
            challenge. You&rsquo;ll receive an email notification every time a payout is sent.
          </p>
        </Tip>
      </>
    ),
  },
};
