import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes and admin API endpoints
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isApi = pathname.startsWith("/api/admin");

    // Check for admin session
    const sessionCookie = request.cookies.get("admin_session");
    let isValidSession = false;

    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (
          session &&
          session.user &&
          session.expiresAt &&
          session.expiresAt > Date.now()
        ) {
          isValidSession = true;
        }
      } catch {
        isValidSession = false;
      }
    }

    // If user is already authenticated and visits /admin/login, redirect to /admin dashboard
    if (pathname === "/admin/login") {
      if (isValidSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // Reject or redirect unauthenticated requests
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
