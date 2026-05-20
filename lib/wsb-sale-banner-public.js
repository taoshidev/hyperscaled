/**
 * Client-safe mirror of WSB_SALE_BANNER — set in next.config `env` as
 * NEXT_PUBLIC_WSB_SALE_BANNER (defaults false when the server env is unset).
 */
export function isWsbSaleBannerPublic() {
  return process.env.NEXT_PUBLIC_WSB_SALE_BANNER === "true";
}
