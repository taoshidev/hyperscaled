import crypto from "crypto";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";

const SUMSUB_BASE_URL = "https://api.sumsub.com";
const APP_TOKEN = () => process.env.SUMSUB_APP_TOKEN;
const SECRET_KEY = () => process.env.SUMSUB_SECRET_KEY;
const WEBHOOK_SECRET = () => process.env.SUMSUB_WEBHOOK_SECRET;
const LEVEL_NAME = () => process.env.SUMSUB_LEVEL_NAME || "basic-kyc-level";

function generateSignature(method, url, ts, body = "") {
  const data = ts + method.toUpperCase() + url + body;
  return crypto
    .createHmac("sha256", SECRET_KEY())
    .update(data)
    .digest("hex");
}

async function sumsubFetch(method, path, body = null) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const bodyStr = body ? JSON.stringify(body) : "";
  const sig = generateSignature(method, path, ts, bodyStr);

  const headers = {
    "X-App-Token": APP_TOKEN(),
    "X-App-Access-Sig": sig,
    "X-App-Access-Ts": ts,
    Accept: "application/json",
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${SUMSUB_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? bodyStr : undefined,
  });

  return res;
}

export async function createApplicant(externalUserId, email) {
  const path = "/resources/applicants?levelName=" + encodeURIComponent(LEVEL_NAME());
  const payload = { externalUserId };
  if (email) payload.email = email;

  const res = await sumsubFetch("POST", path, payload);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SumSub createApplicant failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function getApplicant(externalUserId) {
  const path = `/resources/applicants/-;externalUserId=${encodeURIComponent(externalUserId)}/one`;
  const res = await sumsubFetch("GET", path);
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SumSub getApplicant failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function generateAccessToken(externalUserId) {
  const path = `/resources/accessTokens?userId=${encodeURIComponent(externalUserId)}&levelName=${encodeURIComponent(LEVEL_NAME())}`;
  const res = await sumsubFetch("POST", path);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SumSub generateAccessToken failed (${res.status}): ${text}`);
  }
  return res.json();
}

export function verifyWebhookSignature(payload, digestHeader) {
  const hmac = crypto
    .createHmac("sha256", WEBHOOK_SECRET())
    .update(payload)
    .digest("hex");
  return hmac === digestHeader;
}

export async function getUserByWallet(wallet) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.wallet, wallet.toLowerCase()))
    .limit(1);
  return rows[0] || null;
}

export async function createUserByWallet(wallet) {
  const [newUser] = await db
    .insert(users)
    .values({ wallet: wallet.toLowerCase() })
    .returning();
  return newUser;
}

export async function updateKycStatus(wallet, fields) {
  const update = { updatedAt: new Date() };
  if (fields.kycStatus !== undefined) update.kycStatus = fields.kycStatus;
  if (fields.kycApplicantId !== undefined) update.kycApplicantId = fields.kycApplicantId;
  if (fields.kycVerifiedAt !== undefined) update.kycVerifiedAt = fields.kycVerifiedAt;

  await db
    .update(users)
    .set(update)
    .where(eq(users.wallet, wallet.toLowerCase()));
}
