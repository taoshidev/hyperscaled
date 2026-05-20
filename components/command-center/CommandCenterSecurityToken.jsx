"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Warning } from "@phosphor-icons/react";

const VERIFY_PATH = "/api/command-center/security-token";

export function CommandCenterSecurityToken() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (e) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(VERIFY_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      if (res.status === 429) {
        let retrySeconds = 0;
        try {
          const json = await res.json();
          retrySeconds = Number(json?.retryAfterSeconds) || 0;
        } catch {
          // ignore
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
            ? `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
            : "Too many attempts. Try again later."
        );
        return;
      }

      if (!res.ok) {
        setError("Unauthorized — access blocked.");
        return;
      }

      const json = await res.json();
      router.push(json.redirectTo || "/command-center/promo-codes");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  async function handleSignOut() {
    await fetch("/api/command-center/session", { method: "DELETE" });
    router.push("/command-center/login");
    router.refresh();
  }

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
          <img src="/hyperscaled-logo.svg" alt="Hyperscaled" className="h-7 w-auto" />
        </Link>

        <div
          className="rounded-2xl border border-white/[0.08] bg-zinc-900/70 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          role="region"
          aria-label="Command Center security verification"
        >
          <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <label className="text-sm font-medium text-zinc-300" htmlFor="cc-security-token">
                Security token
              </label>
              <input
                id="cc-security-token"
                name="securityToken"
                type="password"
                autoComplete="one-time-code"
                value={token}
                onChange={(ev) => setToken(ev.target.value)}
                placeholder="Enter the shared secret"
                disabled={busy}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus-visible:border-teal-400/50 focus-visible:ring-2 focus-visible:ring-teal-400/40"
              />

              <button
                type="submit"
                disabled={busy || !token.trim()}
                className="group inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-400 px-4 text-sm font-semibold text-black transition-colors hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>Verifying…</>
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
            </form>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="text-center text-xs font-medium text-zinc-400 underline underline-offset-2 hover:text-zinc-200 disabled:opacity-50"
            >
              Use a different wallet
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
