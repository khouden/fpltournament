import { Session } from "@/types/auth";
import { signSession, verifySessionToken } from "@/lib/auth-crypto";

export const SESSION_STORAGE_KEY = "admin_session";
export const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const SESSION_DURATION_MS = SESSION_DURATION_SECONDS * 1000;

export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_STORAGE_KEY,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

/**
 * Creates an in-memory Session object with expiration.
 */
export function createSession(email: string): Session {
  return {
    user: {
      id: "admin",
      email,
    },
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
}

/**
 * Validates the structure and timestamp of a Session object.
 */
export function validateSession(session: Session | null | undefined): boolean {
  return (
    session !== null &&
    session !== undefined &&
    session.user !== null &&
    typeof session.expiresAt === "number" &&
    session.expiresAt > Date.now()
  );
}

/**
 * Generates an HMAC-signed session token for storage in the cookie.
 */
export async function createSignedSessionCookieValue(
  session: Session
): Promise<string> {
  return signSession(session);
}

/**
 * Verifies an incoming cookie value using HMAC-SHA256 signature verification.
 */
export async function verifySessionCookieValue(
  cookieValue: string | undefined | null
): Promise<Session | null> {
  return verifySessionToken(cookieValue);
}

/**
 * Extracts and cryptographically verifies session from a raw Cookie header string.
 */
export async function getSessionFromCookie(
  cookieHeader: string | null
): Promise<Session | null> {
  if (!cookieHeader) return null;

  try {
    const cookies = cookieHeader.split("; ").reduce(
      (acc, cookie) => {
        const [key, ...rest] = cookie.split("=");
        acc[key] = decodeURIComponent(rest.join("="));
        return acc;
      },
      {} as Record<string, string>
    );

    const sessionData = cookies[SESSION_STORAGE_KEY];
    if (!sessionData) return null;

    // Verify cryptographic signature
    return await verifySessionCookieValue(sessionData);
  } catch {
    return null;
  }
}

/**
 * Returns a serialized Set-Cookie header string with secure attributes.
 */
export function setSessionCookieHeader(signedToken: string): string {
  const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_STORAGE_KEY}=${signedToken}; Path=/; HttpOnly; Max-Age=${SESSION_DURATION_SECONDS}; SameSite=Lax${secureFlag}`;
}
