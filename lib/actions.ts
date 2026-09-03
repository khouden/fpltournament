"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

// Admin credentials - in production, this should be from env or a more secure source
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@tournament.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function loginAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // Validate credentials
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return {
      success: false,
      error: "Invalid email or password",
    };
  }

  // Create session
  const session = createSession(email);

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("admin_session", JSON.stringify(session), {
    httpOnly: true,
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    sameSite: "lax",
  });

  return { success: true };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  redirect("/");
}
