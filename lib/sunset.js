// Hyperscaled sunset (Notion #1560). Every brand served by this app is retired
// on December 15, 2026 and new account creation is closed now. Existing
// accounts keep working until then.
//
// The copy below is product-approved and must stay word for word — including
// the full "December 15, 2026" date. It is shown verbatim on every brand
// (Hyperscaled, Hyperstack, Vanta HL, Beanstock, LunarCrush). Do not add
// performance/earnings claims, "funded", "payouts", or any promise of account
// migration.

export const VANTA_TRADING_URL = "https://vantatrading.io";

export const SUNSET_BANNER_COPY = {
  desktop:
    "Hyperscaled is being retired on December 15, 2026. New account creation is now closed. Existing accounts will continue to work until that date. To keep trading with us, create a Vanta Trading account.",
  desktopCta: "Create a Vanta Trading account",
  mobile: "Hyperscaled is being retired on December 15, 2026. New accounts are closed.",
  mobileCta: "Move to Vanta Trading →",
};

export const REGISTRATION_CLOSED_COPY = {
  heading: "Hyperscaled is no longer accepting new accounts",
  body: "Hyperscaled is being retired on December 15, 2026, so we've closed new registrations. If you'd like to trade with us, you can create a Vanta Trading account instead.",
  cta: "Go to Vanta Trading",
};

// Single switch every account-creating path checks. Tests mock this module to
// exercise the pre-sunset registration logic that still lives behind it.
export const REGISTRATIONS_CLOSED = true;

export const REGISTRATIONS_CLOSED_CODE = "REGISTRATIONS_CLOSED";

// One sentence stream for API callers (web, SDK/CLI, extension): heading +
// body, so a CLI user reads the same words the blocked page shows.
export const REGISTRATIONS_CLOSED_MESSAGE = `${REGISTRATION_CLOSED_COPY.heading}. ${REGISTRATION_CLOSED_COPY.body}`;
