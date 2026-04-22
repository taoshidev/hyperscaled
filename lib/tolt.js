import { reportError } from "@/lib/errors";

const TOLT_API_BASE = "https://api.tolt.com";

function getApiKey() {
  return process.env.TOLT_API_KEY || null;
}

async function toltFetch(endpoint, body, { okOnConflict = false } = {}) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const res = await fetch(`${TOLT_API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // 409 = customer already exists; return the body so caller can extract the id
    if (okOnConflict && res.status === 409) {
      const json = await res.json().catch(() => null);
      return json?.data?.[0] || json || null;
    }
    const text = await res.text().catch(() => "");
    throw new Error(`Tolt ${endpoint} ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.data?.[0] || json;
}

export async function trackConversion({ refSlug, referralId, customerIdentifier, amountUsdc }) {
  if ((!refSlug && !referralId) || !getApiKey()) return;

  try {
    console.info("[TOLT] trackConversion start", { refSlug, referralId, customerIdentifier, amountUsdc });

    let customer;

    if (referralId) {
      // Primary path: use the click UUID from Tolt's JS cookie — most reliable
      customer = await toltFetch("/v1/customers", {
        email: customerIdentifier,
        referral_id: referralId,
      }, { okOnConflict: true });
    } else {
      // Fallback: look up click by ref slug
      const click = await toltFetch("/v1/clicks", { param: "ref", value: refSlug });
      const partnerId = click?.partner_id;
      if (!partnerId) {
        console.warn("[TOLT] click returned no partner_id", { refSlug });
        return;
      }
      customer = await toltFetch("/v1/customers", {
        email: customerIdentifier,
        partner_id: partnerId,
      }, { okOnConflict: true });
    }

    const customerId = customer?.id;
    if (!customerId) {
      console.warn("[TOLT] no customer_id to create transaction", { customerIdentifier });
      return;
    }

    const amountCents = Math.round(amountUsdc * 100);
    await toltFetch("/v1/transactions", {
      amount: amountCents,
      customer_id: customerId,
      billing_type: "one_time",
    });

    console.info("[TOLT] trackConversion complete", { referralId, customerId, amountCents });
  } catch (err) {
    console.error("[TOLT] trackConversion failed", { error: err?.message });
    reportError(err, {
      source: "lib/tolt",
      metadata: { refSlug, referralId, amountUsdc },
    });
  }
}
