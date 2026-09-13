import type { Session } from "@/types/auth";

const DEFAULT_DEV_SECRET =
  "fpl-tournaments-dev-insecure-secret-32-chars-minimum-key!";
const PBKDF2_ITERATIONS = 100000;

function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Returns the configured AUTH_SECRET.
 * Throws in production if missing.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "CRITICAL SECURITY ERROR: AUTH_SECRET must be configured in production environment variables."
      );
    }
    return DEFAULT_DEV_SECRET;
  }
  return secret;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Cryptographically signs a session object using HMAC-SHA256.
 * Returns a URL-safe token format: `<payloadBase64Url>.<signatureBase64Url>`.
 */
export async function signSession(
  session: Session,
  customSecret?: string
): Promise<string> {
  const secret = customSecret || getAuthSecret();
  const key = await getHmacKey(secret);
  const encoder = new TextEncoder();

  const payloadStr = JSON.stringify(session);
  const payloadB64 = bufferToBase64Url(encoder.encode(payloadStr));

  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = bufferToBase64Url(signatureBuffer);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies the HMAC-SHA256 signature and expiration of a session token.
 * Returns the decoded Session if valid and active, or null if forged, tampered, or expired.
 */
export async function verifySessionToken(
  token: string | undefined | null,
  customSecret?: string
): Promise<Session | null> {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const secret = customSecret || getAuthSecret();
    const key = await getHmacKey(secret);
    const encoder = new TextEncoder();

    const signatureBytes = base64UrlToBuffer(signatureB64);
    const isValid = await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlToBuffer(payloadB64);
    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(payloadBytes);
    const session = JSON.parse(jsonStr) as Session;

    if (
      !session ||
      !session.user ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Constant-time comparison to prevent side-channel timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);

  if (bufA.byteLength !== bufB.byteLength) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < bufA.byteLength; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

/**
 * Hashes a plaintext password using PBKDF2-HMAC-SHA256 with 100,000 iterations and a unique 16-byte salt.
 * Returns standard format: `pbkdf2$sha256$<iterations>$<saltHex>$<hashHex>`.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const passwordKey = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `pbkdf2$sha256$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`;
}

/**
 * Verifies a candidate password against either:
 * 1. A salted PBKDF2 hash (`pbkdf2$sha256$...`)
 * 2. A fallback plaintext password (using timing-safe comparison)
 */
export async function verifyPassword(
  password: string,
  storedHashOrPlain: string
): Promise<boolean> {
  if (!password || !storedHashOrPlain) return false;

  if (storedHashOrPlain.startsWith("pbkdf2$sha256$")) {
    const parts = storedHashOrPlain.split("$");
    if (parts.length !== 5) return false;

    const iterations = parseInt(parts[2], 10);
    const saltHex = parts[3];
    const expectedHashHex = parts[4];

    if (isNaN(iterations) || !saltHex || !expectedHashHex) return false;

    const saltMatches = saltHex.match(/.{1,2}/g);
    if (!saltMatches) return false;
    const salt = new Uint8Array(saltMatches.map((byte) => parseInt(byte, 16)));

    const encoder = new TextEncoder();
    const passwordKey = await globalThis.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await globalThis.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256",
      },
      passwordKey,
      256
    );

    const computedHashHex = Array.from(new Uint8Array(derivedBits))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return timingSafeEqual(computedHashHex, expectedHashHex);
  }

  // Fallback plaintext comparison in constant time
  return timingSafeEqual(password, storedHashOrPlain);
}
