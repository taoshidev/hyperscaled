import { reportError } from "@/lib/errors";

const TOLT_API_BASE = "https://api.tolt.com";

function getApiKey() {
  return process.env.TOLT_API_KEY || null;
}

async function toltFetch(endpoint, body) {
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
    const text = await res.text().catch(() => "");
    throw new Error(`Tolt ${endpoint} ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  return json?.data?.[0] || json;
}

export async function trackConversion({ refSlug, customerIdentifier, amountUsdc }) {
  if (!refSlug || !getApiKey()) return;

  try {
    console.info("[TOLT] trackConversion start", { refSlug, customerIdentifier, amountUsdc });

    const click = await toltFetch("/v1/clicks", { param: "ref", value: refSlug });
    const partnerId = click?.partner_id;
    if (!partnerId) {
      console.warn("[TOLT] click returned no partner_id", { refSlug });
      return;
    }

    let customer;
    try {
      customer = await toltFetch("/v1/customers", {
        email: customerIdentifier,
        partner_id: partnerId,
      });
    } catch (err) {
      if (err.message?.includes("409")) {
        console.info("[TOLT] customer already exists", { customerIdentifier });
      } else {
        throw err;
      }
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

    console.info("[TOLT] trackConversion complete", { refSlug, partnerId, customerId, amountCents });
  } catch (err) {
    console.error("[TOLT] trackConversion failed", { error: err?.message });
    reportError(err, {
      source: "lib/tolt",
      metadata: { refSlug, amountUsdc },
    });
  }
}
