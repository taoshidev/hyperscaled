import { test, expect } from "@playwright/test";

// Notion #1560 — Hyperscaled sunset. Covers the ticket's acceptance criteria
// end to end against the real app:
//   - the retirement banner renders on every page type, above the nav, with
//     the approved copy word for word (desktop and compact mobile variants)
//   - its CTA opens https://vantatrading.io in a new tab
//   - it is NOT dismissible on marketing/signup pages, and IS dismissible for
//     the browser session on the wallet-connected dashboard
//   - every signup route shows the closure notice instead of a form
//   - the registration API refuses with a clear 410
//
// The e2e dev server boots wagmi with an auto-connecting mock wallet, so
// /dashboard is always the "connected" (signed-in) view here.

const DESKTOP_COPY =
  "Hyperscaled is being retired on December 15, 2026. New account creation is now closed. Existing accounts will continue to work until that date. To keep trading with us, create a Vanta Trading account.";
const MOBILE_COPY =
  "Hyperscaled is being retired on December 15, 2026. New accounts are closed.";
const CLOSED_HEADING = "Hyperscaled is no longer accepting new accounts";
const CLOSED_BODY =
  "Hyperscaled is being retired on December 15, 2026, so we've closed new registrations. If you'd like to trade with us, you can create a Vanta Trading account instead.";
const VANTA_URL = "https://vantatrading.io";

const banner = (page) => page.locator('[data-testid="sunset-banner"]');
const dismissButton = (page) => page.locator('[data-testid="sunset-banner-dismiss"]');

async function expectVantaLink(link, label) {
  await expect(link).toBeVisible();
  await expect(link).toHaveText(label);
  await expect(link).toHaveAttribute("href", /^https:\/\/vantatrading\.io\/?$/);
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
}

test.describe("Sunset banner — desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders above the nav with the exact desktop copy and CTA", async ({ page }) => {
    await page.goto("/");
    const b = banner(page);
    await expect(b).toBeVisible();
    await expect(b.locator("p:visible")).toHaveText(DESKTOP_COPY);
    await expectVantaLink(
      page.locator('[data-testid="sunset-banner-cta"]'),
      "Create a Vanta Trading account",
    );

    const bannerBox = await b.boundingBox();
    expect(bannerBox.y).toBe(0);
    // The header springs in from y:-24 on mount; wait for it to settle.
    await expect
      .poll(async () => Math.round((await page.locator("header").boundingBox()).y))
      .toBe(Math.round(bannerBox.height));
  });

  test("stays pinned to the top while scrolling", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: 4000, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const box = await banner(page).boundingBox();
    expect(box.y).toBe(0);
  });

  for (const path of ["/", "/pricing", "/register", "/leaderboard", "/status", "/vanta", "/bitcast/pricing"]) {
    test(`is not dismissible on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(banner(page)).toBeVisible();
      await expect(dismissButton(page)).toHaveCount(0);
    });
  }

  test("is dismissible for the session on the wallet-connected dashboard only", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(dismissButton(page)).toBeVisible({ timeout: 30_000 });
    await dismissButton(page).click();
    await expect(banner(page)).toHaveCount(0);

    // Same session: stays dismissed on the dashboard after a reload.
    await page.reload();
    await expect(page.locator("header")).toBeVisible();
    await expect(banner(page)).toHaveCount(0, { timeout: 30_000 });

    // Landing page is never dismissible — the banner is back.
    await page.goto("/");
    await expect(banner(page)).toBeVisible();
    await expect(dismissButton(page)).toHaveCount(0);
  });

  test("reappears in a new session", async ({ browser }) => {
    const first = await browser.newContext();
    const page = await first.newPage();
    await page.goto("/dashboard");
    await dismissButton(page).click({ timeout: 30_000 });
    await expect(banner(page)).toHaveCount(0);
    await first.close();

    const second = await browser.newContext();
    const fresh = await second.newPage();
    await fresh.goto("/dashboard");
    await expect(banner(fresh)).toBeVisible();
    await expect(dismissButton(fresh)).toBeVisible({ timeout: 30_000 });
    await second.close();
  });

  test("nav CTA points to Vanta Trading instead of /register", async ({ page }) => {
    await page.goto("/");
    await expectVantaLink(
      page.locator('[data-testid="nav-vanta-trading-cta"]'),
      "Go to Vanta Trading",
    );
    await expect(page.locator('a[href*="/register"]')).toHaveCount(0);
  });
});

test.describe("Sunset banner — mobile", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("shows the compact copy and link, and the nav still fits", async ({ page }) => {
    await page.goto("/");
    const b = banner(page);
    await expect(b.locator("p:visible")).toHaveText(`${MOBILE_COPY} Move to Vanta Trading →`);
    await expectVantaLink(
      page.locator('[data-testid="sunset-banner-cta-mobile"]'),
      "Move to Vanta Trading →",
    );
    await expect(page.locator('[data-testid="sunset-banner-cta"]')).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu" })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });
});

test.describe("Sunset banner — tablet", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("uses the full desktop copy", async ({ page }) => {
    await page.goto("/");
    await expect(banner(page).locator("p:visible")).toHaveText(DESKTOP_COPY);
  });
});

test.describe("Registration closed", () => {
  for (const path of [
    "/register",
    "/register?tier=5000",
    "/vanta/register",
    "/bitcast/register",
    "/beanstock/register",
    "/lunarcrush/register",
    "/miner/vanta",
    "/vanta/start",
  ]) {
    test(`${path} shows the closure notice instead of a form`, async ({ page }) => {
      await page.goto(path);
      const notice = page.locator('[data-testid="registration-closed"]');
      await expect(notice.getByRole("heading", { level: 1 })).toHaveText(CLOSED_HEADING);
      await expect(notice.locator("p")).toHaveText(CLOSED_BODY);
      await expectVantaLink(
        page.locator('[data-testid="registration-closed-cta"]'),
        "Go to Vanta Trading",
      );
      await expect(page.getByRole("textbox")).toHaveCount(0);
    });
  }

  test("the registration API refuses with a user-readable 410", async ({ request }) => {
    const body = {
      minerSlug: "vanta",
      hlAddress: "0x1111111111111111111111111111111111111111",
      accountSize: 5000,
      tierIndex: 1,
      email: "trader@example.com",
    };
    for (const path of ["/api/register", "/api/register/preflight"]) {
      const res = await request.post(path, { data: body });
      expect(res.status(), path).toBe(410);
      expect(await res.json()).toEqual({
        error: `${CLOSED_HEADING}. ${CLOSED_BODY}`,
        code: "REGISTRATIONS_CLOSED",
        url: VANTA_URL,
      });
    }
  });
});
