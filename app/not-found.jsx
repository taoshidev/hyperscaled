import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export const metadata = {
  title: "Not Found · Hyperscaled",
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#09090b] px-4 py-16 text-center text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(0, 198, 167, 0.18) 0%, transparent 70%)",
        }}
      />
      <div className="relative">
        <Link
          href="/"
          className="mb-10 inline-flex items-center justify-center opacity-90 transition-opacity hover:opacity-100"
        >
          <img
            src="/hyperscaled-logo.svg"
            alt="Hyperscaled"
            className="h-7 w-auto"
          />
        </Link>
        <div className="mb-3 flex items-center justify-center gap-1.5">
          <span className="pulse-teal h-1.5 w-1.5 rounded-full bg-teal-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-teal-400">
            404
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          This page cannot be found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          The page you tried to load does not exist or you do not have access
          to it. Head back to the homepage to keep exploring Hyperscaled.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-teal-300"
          >
            Back to home
            <ArrowRight
              size={15}
              weight="bold"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
