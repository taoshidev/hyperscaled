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

// Called server-side after a successful payment. customerId comes from the
// client's window.tolt.signup() call made during the payment step.
export async function trackConversion({ customerId, amountUsdc }) {
  if (!customerId || !getApiKey()) return;

  try {
    console.info("[TOLT] trackConversion start", { customerId, amountUsdc });

    const amountCents = Math.round(amountUsdc * 100);
    await toltFetch("/v1/transactions", {
      amount: amountCents,
      customer_id: customerId,
      billing_type: "one_time",
    });

    console.info("[TOLT] trackConversion complete", { customerId, amountCents });
  } catch (err) {
    console.error("[TOLT] trackConversion failed", { error: err?.message });
    reportError(err, {
      source: "lib/tolt",
      metadata: { customerId, amountUsdc },
    });
  }
}
