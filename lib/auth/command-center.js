import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAddress } from "viem";

import { getDb } from "@/lib/db/index.js";
import { commandCenterStaff } from "@/lib/db/schema.js";
import {
  COMMAND_CENTER_SESSION_COOKIE,
  verifySessionCookie,
} from "@/lib/auth/command-center-session.js";
import { commandCenterSecurityTokenConfigured } from "@/lib/auth/command-center-security.js";

const STAFF_ROLES = new Set(["admin", "super_admin"]);

/**
 * Look up an active staff row by wallet (checksummed). Returns null if the
 * wallet has no row, or if the role is not recognized.
 */
export async function getStaffByWallet(wallet) {
  if (!wallet) return null;
  let normalized;
  try {
    normalized = getAddress(wallet);
  } catch {
    return null;
  }
  const db = await getDb();
  const [row] = await db
    .select()
    .from(commandCenterStaff)
    .where(eq(commandCenterStaff.wallet, normalized))
    .limit(1);
  if (!row) return null;
  if (!STAFF_ROLES.has(row.role)) return null;
  return row;
}

/**
 * Read the current command-center session, or null when the cookie is
 * missing/invalid/expired. Does not touch the database.
 */
export async function readCommandCenterSession() {
  const store = await cookies();
  const raw = store.get(COMMAND_CENTER_SESSION_COOKIE)?.value;
  return verifySessionCookie(raw);
}

/**
 * Server gate for /command-center/* pages. Mirrors vanta-ui's `requireAdmin`
 * semantics: missing/invalid session → redirect to login; signed in but not
 * an active staff row → notFound() so unauthorized users see a 404 rather
 * than a "you're banned" message.
 */
export async function requireCommandCenterStaff() {
  const session = await readCommandCenterSession();
  if (!session) {
    redirect("/command-center/login");
  }
  if (commandCenterSecurityTokenConfigured() && session.secured !== true) {
    redirect("/command-center/security-token");
  }

  const staff = await getStaffByWallet(session.wallet);
  if (!staff) {
    notFound();
  }

  return {
    wallet: staff.wallet,
    role: staff.role,
    label: staff.label,
    sessionExp: session.exp,
  };
}

/**
 * Same as `requireCommandCenterStaff` but for API route handlers — returns a
 * structured result so the caller can craft an HTTP response instead of
 * triggering a Next.js redirect/notFound.
 */
export async function requireCommandCenterStaffForRoute() {
  const session = await readCommandCenterSession();
  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (commandCenterSecurityTokenConfigured() && session.secured !== true) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  const staff = await getStaffByWallet(session.wallet);
  if (!staff) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return {
    ok: true,
    staff: {
      wallet: staff.wallet,
      role: staff.role,
      label: staff.label,
    },
  };
}
