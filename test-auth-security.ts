import {
  signSession,
  verifySessionToken,
  hashPassword,
  verifyPassword,
  timingSafeEqual,
} from "./lib/auth-crypto";
import { loginAction } from "./lib/actions";
import type { Session } from "./types/auth";

async function runSecurityTests() {
  console.log("==================================================");
  console.log("🔐 COMPREHENSIVE AUTH & CRYPTO SECURITY TEST SUITE");
  console.log("==================================================\n");

  let total = 0;
  let passed = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [TEST ${total}] PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [TEST ${total}] FAIL: ${testName}`);
    }
  }

  // 1. Session Signing & Verification
  console.log("--- 1. Cryptographic HMAC-SHA256 Session Signing & Verification ---");
  const testSession: Session = {
    user: { id: "admin", email: "admin@tournament.local" },
    expiresAt: Date.now() + 3600 * 1000,
  };

  const token = await signSession(testSession);
  assert(typeof token === "string" && token.includes("."), "Session is signed into token format (<payload>.<signature>)");

  const verified = await verifySessionToken(token);
  assert(verified !== null && verified.user?.email === "admin@tournament.local", "Legitimate token successfully verified");

  // 2. Tamper-Resistance Tests
  console.log("\n--- 2. Tamper & Forgery Resistance ---");
  const [payloadB64, sigB64] = token.split(".");

  // Tampered payload
  const tamperedPayload = payloadB64.slice(0, -2) + "==";
  const tamperedPayloadToken = `${tamperedPayload}.${sigB64}`;
  const tamperedResult = await verifySessionToken(tamperedPayloadToken);
  assert(tamperedResult === null, "Tampered payload is rejected (HMAC mismatch)");

  // Tampered signature
  const tamperedSig = sigB64.slice(0, -2) + (sigB64.endsWith("a") ? "b" : "a") + "=";
  const tamperedSigToken = `${payloadB64}.${tamperedSig}`;
  const tamperedSigResult = await verifySessionToken(tamperedSigToken);
  assert(tamperedSigResult === null, "Tampered signature is rejected (HMAC mismatch)");

  // Arbitrary raw JSON cookie (The previous critical vulnerability!)
  const rawJsonAttack = JSON.stringify({
    user: { id: "admin", email: "hacker@evil.com" },
    expiresAt: Date.now() + 99999999999,
  });
  const rawAttackResult = await verifySessionToken(rawJsonAttack);
  assert(rawAttackResult === null, "Raw unsigned JSON cookie attack is completely blocked");

  // Token signed with wrong secret key
  const foreignToken = await signSession(testSession, "different-unauthorized-secret-key-32ch");
  const foreignResult = await verifySessionToken(foreignToken);
  assert(foreignResult === null, "Token signed with foreign/unknown secret is rejected");

  // 3. Expiration Verification
  console.log("\n--- 3. Expiration Verification ---");
  const expiredSession: Session = {
    user: { id: "admin", email: "admin@tournament.local" },
    expiresAt: Date.now() - 1000, // Expired 1 second ago
  };
  const expiredToken = await signSession(expiredSession);
  const expiredResult = await verifySessionToken(expiredToken);
  assert(expiredResult === null, "Expired token is rejected even with valid cryptographic signature");

  // 4. Password Hashing (PBKDF2-SHA256)
  console.log("\n--- 4. Password Hashing & Verification (PBKDF2-SHA256) ---");
  const password = "SuperSecretPassword!@#123";
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);

  assert(hash1.startsWith("pbkdf2$sha256$100000$"), "Hash adheres to standard pbkdf2$sha256 format");
  assert(hash1 !== hash2, "Successive hashes use unique cryptographic salts (different hashes for same password)");

  const correctPassResult = await verifyPassword(password, hash1);
  assert(correctPassResult === true, "Valid password successfully verified against PBKDF2 hash");

  const wrongPassResult = await verifyPassword("WrongPassword456!", hash1);
  assert(wrongPassResult === false, "Incorrect password rejected against PBKDF2 hash");

  // 5. Timing-Safe Comparison
  console.log("\n--- 5. Timing-Safe Comparison ---");
  assert(timingSafeEqual("securetoken", "securetoken") === true, "Matching strings pass timingSafeEqual");
  assert(timingSafeEqual("securetoken", "wrongtoken") === false, "Differing strings fail timingSafeEqual");
  assert(timingSafeEqual("short", "longerstring") === false, "Different length strings fail timingSafeEqual safely");

  // 6. Login Action & Rate Limiting
  console.log("\n--- 6. Login Server Action & Brute-Force Rate Limiting ---");
  const bruteForceEmail = `attacker-${Date.now()}@test.com`;

  // Send failed attempts up to limit
  let lastResult;
  for (let i = 1; i <= 5; i++) {
    lastResult = await loginAction(bruteForceEmail, "wrong-password");
  }
  assert(lastResult?.error === "Invalid email or password", "5th attempt reports Invalid email or password");

  // 6th attempt should be blocked by rate limiter
  const lockedOutResult = await loginAction(bruteForceEmail, "wrong-password");
  assert(
    Boolean(lockedOutResult?.error?.includes("Too many failed attempts")),
    "6th attempt is blocked with rate limit lockout message"
  );

  console.log("\n==================================================");
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log("==================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
