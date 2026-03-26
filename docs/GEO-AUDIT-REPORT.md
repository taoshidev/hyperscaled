# GEO Audit Report: Hyperscaled

**Audit Date:** 2026-03-26
**URL:** https://hyperscaled.trade (audited via localhost:4568)
**Business Type:** SaaS / Fintech (Decentralized Prop Trading Platform)
**Pages Analyzed:** 9

---

## Executive Summary

**Overall GEO Score: 38/100 (Poor)**

Hyperscaled has strong on-page content and consistent branding, but is severely lacking in the technical infrastructure AI systems need to discover, parse, and cite the site. There is zero structured data (JSON-LD), no robots.txt, no sitemap.xml, no llms.txt, and OpenGraph images are broken on every page due to a Next.js metadata merging bug. The content itself is well-written and quotable, but AI crawlers have no structured way to understand what the site is or does.

### Score Breakdown

| Category | Score | Weight | Weighted Score |
|---|---|---|---|
| AI Citability | 55/100 | 25% | 13.8 |
| Brand Authority | 25/100 | 20% | 5.0 |
| Content E-E-A-T | 45/100 | 20% | 9.0 |
| Technical GEO | 20/100 | 15% | 3.0 |
| Schema & Structured Data | 5/100 | 10% | 0.5 |
| Platform Optimization | 35/100 | 10% | 3.5 |
| **Overall GEO Score** | | | **38/100** |

---

## Critical Issues (Fix Immediately)

### 1. No robots.txt File
**Impact:** AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) have no directives. While this means they're not _blocked_, it also means no sitemap reference, no crawl-rate guidance, and search engines may not discover all pages efficiently.

**Fix:** Create `public/robots.txt`:
```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://hyperscaled.trade/sitemap.xml
```

### 2. No sitemap.xml
**Impact:** Search engines and AI crawlers cannot discover all pages. Only pages linked from the homepage are discoverable.

**Fix:** Create `public/sitemap.xml` or use Next.js `app/sitemap.js` to auto-generate one listing all 11+ routes.

### 3. OpenGraph Images Broken on ALL Pages
**Impact:** When shared on Twitter, Discord, Slack, or LinkedIn, no preview image appears. AI systems that use OG data for context lose this signal.

**Root Cause:** Next.js App Router shallow-merges `openGraph` metadata. When child pages export their own `openGraph` object (with title/description/url), it **replaces** the parent layout's `openGraph` entirely — losing `images`, `type`, and `siteName`.

**Fix:** Add `images`, `type`, and `siteName` to every page's `openGraph` export, or create a shared helper function.

### 4. Zero Structured Data (JSON-LD) Across Entire Site
**Impact:** AI systems cannot identify Hyperscaled as an organization, understand its products, or parse FAQ content programmatically. This is the single biggest GEO gap.

**Fix (minimum):**
- **Organization schema** on homepage (name, url, logo, sameAs for social profiles)
- **FAQPage schema** on `/faq` (22 Q&A pairs — massive citability opportunity)
- **WebSite schema** with SearchAction on homepage
- **Product/Offer schema** on `/pricing` (3 tiers)
- **BreadcrumbList schema** on all pages

### 5. No llms.txt File
**Impact:** AI systems that support the llms.txt standard (emerging convention) cannot quickly understand site structure, key pages, or preferred citation formats.

**Fix:** Create `public/llms.txt` with site description, key pages, and citation preferences.

---

## High Priority Issues

### 6. Missing H1 on /leaderboard and /register
The leaderboard page uses an `<h2>` for "Top traders on the network." and the register page uses `<h2>` for "Choose your funded account size." Both should be `<h1>` tags for proper heading hierarchy.

### 7. No Canonical URLs on Any Page
No `<link rel="canonical">` tags are present. This can cause duplicate content issues if the site is accessible via multiple URLs (www vs non-www, HTTP vs HTTPS, trailing slashes).

**Fix:** Add canonical URLs via Next.js `alternates.canonical` in metadata.

### 8. No meta robots Directives
While not blocking anything currently, explicit `index, follow` directives signal intent to search engines and provide a safety net.

### 9. FAQ Page Has No FAQPage Schema
The FAQ page has 22 well-structured Q&A pairs — this is a goldmine for Google's FAQ rich results and AI citation. Without FAQPage schema, this content is invisible to structured parsers.

### 10. Thin Content on Key Pages
- `/leaderboard`: 63 words (mostly UI chrome)
- `/register`: 129 words
- `/faq`: 245 words (FAQ content is collapsed in accordions — crawlers may not see it)

---

## Medium Priority Issues

### 11. No Author Attribution on Any Content
No author bios, credentials, or bylines appear anywhere. E-E-A-T signals rely heavily on demonstrable expertise — who built this? Who wrote the rules? What's their trading background?

### 12. No "About" Page
There's no dedicated About page explaining the team, company history, or mission. AI systems use About pages heavily for entity recognition.

### 13. Missing Space in H1 Tags
- `/partners`: "firm.Powered" (missing space after period)
- `/agents`: "Agents,come" (missing space after comma)

### 14. No RSS Feed or Content Feed
AI training pipelines and news aggregators use RSS. A blog or updates feed would improve discoverability.

### 15. OG Descriptions Truncated on Some Pages
On /rules, /partners, /agents, /leaderboard, and /register, the `og:description` is shorter than the `meta description`. They should match or the OG description should be independently optimized.

---

## Low Priority Issues

### 16. No Open Graph Image Alt Text
When og:image is fixed, also add `og:image:alt` for accessibility.

### 17. Low Image Count
Most pages have only 2 images (logo + favicon). More visual content improves engagement signals.

### 18. No hreflang Tags
Not an issue unless the site targets multiple languages, but worth noting for future internationalization.

### 19. External Font Loading
Satoshi font loaded from Fontshare CDN adds a render-blocking request. Consider self-hosting for performance.

---

## Category Deep Dives

### AI Citability (55/100)
**Strengths:**
- Clean, well-structured content with clear headings
- FAQ page has 22 Q&A pairs that are highly quotable
- Pricing page has comparison data that AI systems love to cite
- Rules page has detailed, specific parameters (profit targets, drawdown limits)
- Content uses specific numbers ($25K, $50K, $100K, 5% drawdown, 10% profit target)

**Weaknesses:**
- No self-contained answer blocks optimized for extraction
- FAQ content hidden in accordion (JS-dependent — may not be visible to crawlers)
- No "What is Hyperscaled?" definitional content block
- No comparison tables that directly answer "X vs Y" queries
- Missing statistical claims with sources

### Brand Authority (25/100)
**Strengths:**
- Consistent branding across all pages
- Social profiles linked (Twitter, Discord, GitHub)
- Partner program signals institutional credibility

**Weaknesses:**
- No Wikipedia presence
- No evidence of press coverage or third-party reviews
- No "As seen in" or media logos
- GitHub repo exists but unclear activity/stars
- Discord community size unknown
- No LinkedIn company page signals detected

### Content E-E-A-T (45/100)
**Strengths:**
- Content demonstrates domain expertise in prop trading
- Specific, detailed rules and parameters (not vague marketing)
- Comparison with traditional prop firms shows industry knowledge
- Technical language appropriate for target audience

**Weaknesses:**
- No author attribution anywhere
- No About page with team credentials
- No evidence of Experience (real trading results, case studies)
- No external source citations
- No dates on content (freshness signals missing)
- No testimonials or user stories

### Technical GEO (20/100)
**Strengths:**
- Site is server-rendered (Next.js SSR) — content visible to crawlers
- Fast loading, clean HTML
- Proper `lang="en"` attribute
- UTF-8 charset
- Responsive viewport meta tag
- Favicon configured

**Weaknesses:**
- No robots.txt
- No sitemap.xml
- No llms.txt
- No canonical URLs
- No meta robots directives
- OG images broken (metadata merging bug)
- No structured data at all
- Framer Motion animations may delay content visibility for crawlers

### Schema & Structured Data (5/100)
**Score explanation:** 5 points for having valid HTML structure. Zero JSON-LD or microdata detected on any page.

**Missing schemas (by priority):**
1. Organization (homepage) — critical for entity recognition
2. FAQPage (/faq) — immediate rich result opportunity
3. WebSite with SearchAction (homepage)
4. Product/Offer (/pricing) — 3 tiers
5. BreadcrumbList (all pages)
6. HowTo (/how-it-works) — step-by-step content
7. Article or WebPage (all marketing pages)

### Platform Optimization (35/100)
**Strengths:**
- Twitter/X profile linked (@hyperscaledhq)
- Discord community linked
- GitHub organization linked (taoshidev)

**Weaknesses:**
- No YouTube presence detected
- No Reddit presence detected
- No Wikipedia page
- No LinkedIn company page detected
- No Medium/blog content
- No podcast appearances
- No third-party review sites

---

## Quick Wins (Implement This Week)

1. **Fix OG images** — Add `images`, `type`, and `siteName` to every page's openGraph export. ~30 min. Impact: All social sharing immediately gets preview images.

2. **Add robots.txt + sitemap.xml** — Create both files. ~20 min. Impact: AI crawlers discover all pages, search engines index fully.

3. **Add FAQPage schema to /faq** — 22 Q&A pairs → immediate Google FAQ rich results and AI citation boost. ~30 min. Impact: High — FAQ content becomes machine-readable.

4. **Add Organization schema to homepage** — Name, URL, logo, social profiles, description. ~15 min. Impact: AI systems recognize Hyperscaled as an entity.

5. **Create llms.txt** — Site description, key pages, preferred citation format. ~15 min. Impact: AI systems that support this standard get instant context.

---

## 30-Day Action Plan

### Week 1: Critical Technical Fixes
- [ ] Fix OG image metadata merging (add images/type/siteName to all pages)
- [ ] Create robots.txt with AI crawler directives
- [ ] Create sitemap.xml (or Next.js auto-generation)
- [ ] Create llms.txt
- [ ] Add canonical URLs to all pages
- [ ] Fix H1 tags on /leaderboard and /register
- [ ] Fix missing spaces in H1 on /partners and /agents

### Week 2: Structured Data
- [ ] Add Organization JSON-LD to homepage
- [ ] Add FAQPage JSON-LD to /faq
- [ ] Add WebSite + SearchAction JSON-LD to homepage
- [ ] Add Product/Offer JSON-LD to /pricing
- [ ] Add BreadcrumbList JSON-LD to all pages
- [ ] Add HowTo JSON-LD to /how-it-works

### Week 3: Content & E-E-A-T
- [ ] Create About page with team bios and credentials
- [ ] Add author attribution to content pages
- [ ] Write a definitional "What is Hyperscaled?" content block
- [ ] Add FAQ content as visible HTML (not just accordion JS)
- [ ] Ensure FAQ accordion content is in initial HTML (SSR)
- [ ] Add dates/freshness indicators to content

### Week 4: Brand Authority & Platform Expansion
- [ ] Create/optimize LinkedIn company page
- [ ] Submit site to relevant crypto/trading directories
- [ ] Create YouTube channel with explainer content
- [ ] Engage on Reddit (r/proptrading, r/cryptocurrency, r/hyperliquid)
- [ ] Pursue press coverage / guest posts on trading blogs
- [ ] Add testimonials or early user stories to homepage

---

## Appendix: Pages Analyzed

| URL | Title | Word Count | H1 | Schema | OG Image | GEO Issues |
|---|---|---|---|---|---|---|
| / | Hyperscaled — Decentralized Prop Trading on Hyperliquid | 999 | ✅ | ❌ | ❌ | 4 |
| /how-it-works | How It Works \| Hyperscaled | 576 | ✅ | ❌ | ❌ | 3 |
| /pricing | Pricing \| Hyperscaled | 422 | ✅ | ❌ | ❌ | 3 |
| /rules | Rules \| Hyperscaled | 632 | ✅ | ❌ | ❌ | 3 |
| /faq | FAQ \| Hyperscaled | 245 | ✅ | ❌ | ❌ | 4 |
| /partners | Partner Program \| Hyperscaled | 468 | ✅* | ❌ | ❌ | 4 |
| /agents | For Agents \| Hyperscaled | 529 | ✅* | ❌ | ❌ | 4 |
| /leaderboard | Leaderboard \| Hyperscaled | 63 | ❌ | ❌ | ❌ | 5 |
| /register | Start Your Challenge \| Hyperscaled | 129 | ❌ | ❌ | ❌ | 5 |

\* H1 exists but has missing whitespace

---

*Report generated by GEO Audit Tool — 2026-03-26*
