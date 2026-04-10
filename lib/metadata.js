/**
 * Shared metadata helper.
 *
 * Next.js shallow-merges openGraph — child pages that set their own
 * openGraph lose the parent's `images`, `type`, and `siteName`.
 * This helper ensures every page inherits the global OG image and
 * common fields automatically.
 */

const BRAND_META = {
  hyperscaled: {
    siteName: "Hyperscaled",
    siteUrl: "https://hyperscaled.trade",
    twitter: "@hyperscaled",
    ogImage: {
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "Hyperscaled — Scaled Trading on Hyperliquid",
    },
  },
  vanta: {
    siteName: "Vanta Trading",
    siteUrl: "https://vantatrading.io",
    twitter: "@vantatrading",
    ogImage: {
      url: "/og.png",
      width: 1200,
      height: 630,
      alt: "Vanta Trading — Scaled Trading on Hyperliquid",
    },
  },
};

/**
 * Build page-level metadata with guaranteed OG image inheritance.
 *
 * @param {object} opts
 * @param {string} opts.title - Page title (used in template: "Title — Hyperscaled")
 * @param {string} opts.description - Meta description (< 160 chars)
 * @param {string} opts.ogTitle - Open Graph title (can differ from page title)
 * @param {string} opts.ogDescription - Open Graph description
 * @param {string} opts.path - URL path (e.g. "/pricing")
 * @param {string} [opts.robots] - Robots directive, defaults to "index, follow"
 * @param {string} [opts.brand] - Brand key ("hyperscaled" | "vanta")
 */
export function buildMetadata({ title, description, ogTitle, ogDescription, path, robots, brand = "hyperscaled" }) {
  const b = BRAND_META[brand] || BRAND_META.hyperscaled;
  return {
    title,
    description,
    robots: robots || { index: true, follow: true },
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: b.siteName,
      title: ogTitle || title,
      description: ogDescription || description,
      url: path,
      images: [b.ogImage],
    },
    twitter: {
      card: "summary_large_image",
      site: b.twitter,
      creator: b.twitter,
      title: ogTitle || title,
      description: ogDescription || description,
      images: [b.ogImage.url],
    },
  };
}
