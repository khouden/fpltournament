"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  createSignedSessionCookieValue,
  SESSION_STORAGE_KEY,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/session";
import { verifyPassword, timingSafeEqual } from "@/lib/auth-crypto";

// Rate limiting in-memory store for brute-force protection
interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}
const loginRateLimits = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function checkRateLimit(key: string): { allowed: boolean; remainingWaitMs: number } {
  const now = Date.now();
  const record = loginRateLimits.get(key);

  if (!record) {
    return { allowed: true, remainingWaitMs: 0 };
  }

  if (now > record.resetAt) {
    loginRateLimits.delete(key);
    return { allowed: true, remainingWaitMs: 0 };
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    return { allowed: false, remainingWaitMs: record.resetAt - now };
  }

  return { allowed: true, remainingWaitMs: 0 };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const record = loginRateLimits.get(key);

  if (!record || now > record.resetAt) {
    loginRateLimits.set(key, {
      attempts: 1,
      resetAt: now + LOCKOUT_DURATION_MS,
    });
  } else {
    record.attempts += 1;
    loginRateLimits.set(key, record);
  }
}

function clearRateLimit(key: string): void {
  loginRateLimits.delete(key);
}

export async function loginAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const rateLimitKey = normalizedEmail || "unknown";

  // Check brute force rate limit
  const { allowed, remainingWaitMs } = checkRateLimit(rateLimitKey);
  if (!allowed) {
    const minutesLeft = Math.ceil(remainingWaitMs / 60000);
    return {
      success: false,
      error: `Too many failed attempts. Please wait ${minutesLeft} minute${
        minutesLeft > 1 ? "s" : ""
      } before trying again.`,
    };
  }

  // Target admin email
  const configuredEmail = (
    process.env.ADMIN_EMAIL || "admin@tournament.local"
  ).trim().toLowerCase();

  // Target password: prioritzes ADMIN_PASSWORD_HASH, falls back to ADMIN_PASSWORD
  const configuredPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const configuredPlainPassword = process.env.ADMIN_PASSWORD || "admin123";

  // Constant-time email check
  const isEmailValid = timingSafeEqual(normalizedEmail, configuredEmail);

  // Secure password verification (PBKDF2 hash or timing-safe fallback)
  let isPasswordValid = false;
  if (configuredPasswordHash) {
    isPasswordValid = await verifyPassword(password, configuredPasswordHash);
  } else {
    isPasswordValid = await verifyPassword(password, configuredPlainPassword);
  }

  if (!isEmailValid || !isPasswordValid) {
    recordFailedAttempt(rateLimitKey);
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  // Clear failed attempt counter on success
  clearRateLimit(rateLimitKey);

  // Create session object
  const session = createSession(normalizedEmail);

  // Generate cryptographically signed token
  const signedToken = await createSignedSessionCookieValue(session);

  // Set hardened cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_STORAGE_KEY, signedToken, {
    httpOnly: SESSION_COOKIE_OPTIONS.httpOnly,
    secure: SESSION_COOKIE_OPTIONS.secure,
    sameSite: SESSION_COOKIE_OPTIONS.sameSite,
    path: SESSION_COOKIE_OPTIONS.path,
    maxAge: SESSION_COOKIE_OPTIONS.maxAge,
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_STORAGE_KEY);
  redirect("/");
}
