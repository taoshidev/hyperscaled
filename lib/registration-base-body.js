/**
 * Helpers for the dual-wallet Base x402 registration body.
 *
 * The HL ownership signature is bound to the exact JSON bytes of the
 * registration body, so the body must contain only fields the HL wallet
 * is genuinely attesting to (registration intent + payout target). The
 * coupon code is a pricing modifier that the server validates and applies
 * independently — it travels in the `x-coupon-code` request header so the
 * user can change it after capturing an HL signature without invalidating
 * the bundle. Server-side `evaluateRegistrationPricing` is the source of
 * truth for both coupon eligibility and the charged price.
 */

/**
 * Canonical registration body. The same shape is used for the single-wallet
 * Base path, the dual-wallet Base path, and the EIP-712 / free paths (with
 * the path-specific extras merged in by the call site, e.g.
 * `paymentMethod`, `hlTransferHash`).
 *
 * Notes:
 *   - `payoutAddress` falls back to `hlAddress` (NOT to the connected
 *     wallet) so the body is identical at sign-time (HL connected) and at
 *     pay-time (paying wallet connected).
 *   - `hlTransferSender` is intentionally omitted from this builder — for
 *     x402 the server uses `paymentPayload.payload.authorization.from`,
 *     for the EIP-712 path the call site already adds it.
 *   - `couponCode` is intentionally NOT in the body; see file header.
 */
export function buildBaseRegisterBody({
  minerSlug,
  hlAddress,
  accountSize,
  tierIndex,
  payoutAddress,
  email,
  toltCustomerId,
}) {
  return {
    minerSlug,
    hlAddress,
    accountSize,
    payoutAddress,
    tierIndex,
    toltCustomerId,
    email: email || undefined,
  };
}

/**
 * Snapshot of fields the cached HL signature is bound to. Used to detect
 * when the form has changed under the bundle and a fresh signature is
 * required. Addresses are lowercased so casing tweaks don't trip the
 * invalidation. Coupon code is NOT included — it's transported via header
 * and applied server-side, so changing it does not invalidate the bundle.
 */
export function bundleSignedFor({
  minerSlug,
  hlAddress,
  accountSize,
  tierIndex,
  payoutAddress,
  email,
}) {
  return {
    minerSlug,
    hlAddress: (hlAddress || "").toLowerCase(),
    accountSize,
    tierIndex,
    payoutAddress: (payoutAddress || "").toLowerCase(),
    email: email || "",
  };
}

export function bundleStillCovers(bundle, current) {
  if (!bundle) return false;
  const a = bundle.signedFor;
  return (
    a.minerSlug === current.minerSlug &&
    a.hlAddress === current.hlAddress &&
    a.accountSize === current.accountSize &&
    a.tierIndex === current.tierIndex &&
    a.payoutAddress === current.payoutAddress &&
    a.email === current.email
  );
}

/**
 * Trim + uppercase a coupon code and return the request-header dict that
 * carries it on `/api/register` and `/api/register/preflight`. Empty /
 * nullish input returns `{}` so callers can spread unconditionally.
 */
export function couponCodeHeader(rawCouponFromState) {
  const trimmed =
    typeof rawCouponFromState === "string"
      ? rawCouponFromState.trim().toUpperCase()
      : "";
  return trimmed ? { "x-coupon-code": trimmed } : {};
}
