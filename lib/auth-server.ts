import { cookies } from "next/headers";
import { verifySessionCookieValue, SESSION_STORAGE_KEY } from "@/lib/session";
import type { Session } from "@/types/auth";

/**
 * Retrieves and cryptographically verifies the current admin session from incoming cookies.
 * Returns null if unauthenticated, expired, forged, or called outside a request context.
 */
export async function getAdminSessionServer(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_STORAGE_KEY);
    if (!sessionCookie?.value) {
      return null;
    }

    return await verifySessionCookieValue(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Asserts that the current request has an active, cryptographically signed admin session.
 * Throws an Error if called in an unauthenticated or forged request context.
 * Gracefully allows execution if called outside a Next.js request scope (e.g. CLI/tests).
 */
export async function requireAdminSession(): Promise<Session | null> {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside Next.js request context (CLI / test runner)
    return null;
  }

  const sessionCookie = cookieStore.get(SESSION_STORAGE_KEY);
  if (!sessionCookie?.value) {
    throw new Error("Unauthorized: Admin session required");
  }

  const session = await verifySessionCookieValue(sessionCookie.value);
  if (!session) {
    throw new Error("Unauthorized: Invalid or expired admin session");
  }

  return session;
}
