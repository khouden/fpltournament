/**
 * CLI utility to generate a secure PBKDF2 password hash for .env
 *
 * Usage:
 *   npx tsx scripts/generate-password-hash.ts "my-secure-password"
 */

import { hashPassword } from "../lib/auth-crypto";

async function main() {
  const password = process.argv[2] || "admin123";

  console.log("\n🔒 FPL Tournaments - Password Hash Generator");
  console.log("---------------------------------------------");
  console.log(`Input Password: ${password}`);

  const hash = await hashPassword(password);

  console.log(`Generated Hash: ${hash}\n`);
  console.log("Add this to your .env file:");
  console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
}

main().catch(console.error);
