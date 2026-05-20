// HMAC-signed `hs_attr` cookie carrying last-touch attribution
// (affiliate / tenant / promo). Web Crypto so it works in Edge + Node.
export const ATTRIBUTION_COOKIE = "hs_attr";

export const ATTRIBUTION_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 90;

function getSecret() {
  const secret =
    process.env.ATTRIBUTION_COOKIE_SECRET ||
    process.env.COMMAND_CENTER_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "ATTRIBUTION_COOKIE_SECRET must be set to a value of at least 32 characters."
    );
  }
  return secret;
}

function toBase64Url(bytes) {
  let b64;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(bytes).toString("base64");
  } else {
    let bin = "";
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
    b64 = btoa(bin);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function importKey() {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signAttributionCookie(payload) {
  const key = await importKey();
  const json = JSON.stringify({
    a: payload.affiliate ?? null,
    t: payload.tenant ?? null,
    p: payload.promo ?? null,
    c: payload.clickId,
    f: payload.firstTouchAt,
  });
  const payloadBytes = new TextEncoder().encode(json);
  const payloadB64 = toBase64Url(payloadBytes);
  const sigBytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  return `${payloadB64}.${toBase64Url(sigBytes)}`;
}

export async function verifyAttributionCookie(raw) {
  if (!raw || typeof raw !== "string") return null;
  const [payloadB64, sigB64] = raw.split(".");
  if (!payloadB64 || !sigB64) return null;

  let key;
  try {
    key = await importKey();
  } catch {
    return null;
  }

  const expected = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64)),
  );
  const provided = fromBase64Url(sigB64);
  if (!timingSafeEqualBytes(expected, provided)) return null;

  let json;
  try {
    json = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
  } catch {
    return null;
  }

  if (
    !json ||
    typeof json.c !== "string" ||
    typeof json.f !== "number" ||
    (json.a != null && typeof json.a !== "string") ||
    (json.t != null && typeof json.t !== "string") ||
    (json.p != null && typeof json.p !== "string")
  ) {
    return null;
  }

  return {
    affiliate: json.a ?? null,
    tenant: json.t ?? null,
    promo: json.p ?? null,
    clickId: json.c,
    firstTouchAt: json.f,
  };
}

export function attributionCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ATTRIBUTION_COOKIE_TTL_SECONDS,
  };
}
