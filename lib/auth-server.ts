import { cookies } from "next/headers";
import { validateSession } from "@/lib/session";
import type { Session } from "@/types/auth";

/**
 * Retrieves the current admin session from incoming cookies.
 * Returns null if unauthenticated, expired, or called outside a request context.
 */
export async function getAdminSessionServer(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");
    if (!sessionCookie?.value) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value) as Session;
    if (!validateSession(session)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Asserts that the current request has an active, valid admin session.
 * Throws an Error if called in an unauthenticated request context.
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

  const sessionCookie = cookieStore.get("admin_session");
  if (!sessionCookie?.value) {
    throw new Error("Unauthorized: Admin session required");
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session;
    if (!validateSession(session)) {
      throw new Error("Unauthorized: Session expired");
    }
    return session;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Unauthorized")) {
      throw err;
    }
    throw new Error("Unauthorized: Invalid session");
  }
}
