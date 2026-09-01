import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (pathname.startsWith("/admin")) {
    // Allow /admin/login without authentication
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Check for admin session
    const sessionCookie = request.cookies.get("admin_session");
    if (!sessionCookie?.value) {
      // Redirect unauthenticated users to login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const session = JSON.parse(sessionCookie.value);
      // Check if session is still valid (not expired)
      if (session.expiresAt && session.expiresAt < Date.now()) {
        // Session expired, redirect to login
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    } catch {
      // Invalid session data, redirect to login
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
