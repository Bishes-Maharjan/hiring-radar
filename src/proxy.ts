import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/auth/demo";

/**
 * Next.js 16 proxy (route-level convenience redirect layer).
 * In DEMO_MODE: completely open for public read-only demonstration.
 * In Production: redirects unauthenticated browser requests to /login.
 */
export async function proxy(request: NextRequest) {
  // Public showcase mode requires no login redirects
  if (isDemoMode()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Always allow public routes, Auth.js endpoints, and static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for presence of Auth.js v5 session token
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
