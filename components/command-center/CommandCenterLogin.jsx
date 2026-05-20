"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, Warning } from "@phosphor-icons/react";

import { buildSignedMessage } from "@/lib/wallet-auth-shared";

const SESSION_PATH = "/api/command-center/session";

export function CommandCenterLogin() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    try {
      const nonce = String(Date.now());
      const message = buildSignedMessage({ path: SESSION_PATH, nonce, body: "" });
      const signature = await signMessageAsync({ message });
      const res = await fetch(SESSION_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallet: address, signature, nonce }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          let retrySeconds = 0;
          try {
            const json = await res.json();
            retrySeconds = Number(json?.retryAfterSeconds) || 0;
          } catch {
            // Retry hint is best-effort — fall through to the header.
          }
          if (!retrySeconds) {
            const header = Number(res.headers.get("retry-after"));
            if (Number.isFinite(header)) retrySeconds = header;
          }
          const minutes = retrySeconds
            ? Math.max(1, Math.ceil(retrySeconds / 60))
            : null;
          setError(
            minutes
              ? `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
              : "Too many failed attempts. Try again later."
          );
          return;
        }
        setError("Unauthorized — access blocked.");
        return;
      }
      const json = await res.json();
      router.push(json.redirectTo || "/command-center/promo-codes");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message.includes("rejected") ? "Signature rejected." : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#09090b] px-4 py-12 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(0, 198, 167, 0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 opacity-90 transition-opacity hover:opacity-100"
        >
          <img
            src="/hyperscaled-logo.svg"
            alt="Hyperscaled"
            className="h-7 w-auto"
          />
        </Link>

        <div
          className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          role="region"
          aria-label="Command Center sign-in"
        >
          <div className="mx-auto flex w-max max-w-full flex-col gap-4">
            <ConnectButton showBalance={false} chainStatus="icon" />

            <button
              type="button"
              onClick={handleSignIn}
              disabled={!isConnected || busy}
              className="group flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                <>
                  Signing<span aria-hidden>…</span>
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>

            {error ? (
              <div
                role="alert"
                className="flex w-full min-w-0 items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
              >
                <Warning
                  size={16}
                  weight="fill"
                  className="mt-0.5 shrink-0 text-red-400"
                />
                <span>{error}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
