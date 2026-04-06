/**
 * Shared metadata helper.
 *
 * Next.js shallow-merges openGraph — child pages that set their own
 * openGraph lose the parent's `images`, `type`, and `siteName`.
 * This helper ensures every page inherits the global OG image and
 * common fields automatically.
 */

const SITE_URL = "https://hyperscaled.trade";

const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: "Hyperscaled — Funded Trading on Hyperliquid",
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
 */
export function buildMetadata({ title, description, ogTitle, ogDescription, path, robots }) {
  return {
    title,
    description,
    robots: robots || { index: true, follow: true },
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: "Hyperscaled",
      title: ogTitle || title,
      description: ogDescription || description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      site: "@hyperscaled",
      creator: "@hyperscaled",
      title: ogTitle || title,
      description: ogDescription || description,
      images: ["/og.png"],
    },
  };
}
