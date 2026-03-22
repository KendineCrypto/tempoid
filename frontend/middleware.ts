import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Set to false when ready to launch
const WAITLIST_MODE = true;

const PROTECTED_ROUTES = [
  "/register",
  "/send",
  "/marketplace",
  "/account",
  "/name",
];

export function middleware(request: NextRequest) {
  if (!WAITLIST_MODE) return NextResponse.next();

  const path = request.nextUrl.pathname;

  // Block all app routes during waitlist
  const isProtected = PROTECTED_ROUTES.some((route) => path.startsWith(route));

  if (isProtected) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/register/:path*", "/send", "/marketplace", "/account", "/name/:path*"],
};
