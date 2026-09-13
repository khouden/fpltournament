import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth-crypto";

const SESSION_COOKIE_NAME = "admin_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes and admin API endpoints
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isApi = pathname.startsWith("/api/admin");

    // Cryptographically verify admin session cookie HMAC signature
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
    const session = sessionCookie?.value
      ? await verifySessionToken(sessionCookie.value)
      : null;
    const isValidSession = session !== null && session.expiresAt > Date.now();

    // If user is already authenticated and visits /admin/login, redirect to /admin dashboard
    if (pathname === "/admin/login") {
      if (isValidSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Reject or redirect unauthenticated or forged requests
    if (!isValidSession) {
      if (isApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
