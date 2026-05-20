const DRAFT_STORAGE_KEY = "hs_register_connect_draft";
const DRAFT_TTL_MS = 90 * 1000;

export function persistConnectDraft({
  minerSlug,
  accountSize,
  hlWallet,
  email,
  couponCode,
  paymentMethod,
  payoutWallet,
}) {
  if (typeof window === "undefined") return;
  if (!minerSlug || !Number.isFinite(accountSize) || accountSize <= 0) return;

  const hasContent =
    (hlWallet && hlWallet.trim()) ||
    (email && email.trim()) ||
    (couponCode && couponCode.trim()) ||
    (payoutWallet && payoutWallet.trim()) ||
    paymentMethod;

  if (!hasContent) {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    sessionStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        minerSlug,
        accountSize,
        hlWallet: hlWallet || "",
        email: email || "",
        couponCode: couponCode || "",
        paymentMethod: paymentMethod || null,
        payoutWallet: payoutWallet || "",
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* private browsing / quota */
  }
}

export function readConnectDraft({ minerSlug, accountSize }) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }

    const data = JSON.parse(raw);
    if (data.savedAt && Date.now() - data.savedAt > DRAFT_TTL_MS) {
      return null;
    }
    if (
      data.minerSlug !== minerSlug ||
      Number(data.accountSize) !== Number(accountSize)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearConnectDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
