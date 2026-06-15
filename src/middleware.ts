import { NextResponse, type NextRequest } from "next/server";

/**
 * Lightweight edge gate. With database sessions, the session is an opaque
 * cookie that can only be resolved by a DB lookup (Node runtime + Prisma
 * adapter) — which can't run in edge middleware. So here we only check for the
 * presence of the Auth.js session cookie and bounce obviously-anonymous
 * requests to the sign-in page.
 *
 * This is a UX optimization, NOT the security boundary: every protected page
 * and every mutating server action independently enforces real authn/authz via
 * `requireUserPage` / `requireUser` / `requireAdmin`. A forged cookie gets past
 * middleware but fails immediately at the server guard.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest) {
  const { nextUrl } = req;

  const isProtected =
    nextUrl.pathname.startsWith("/bookings") ||
    nextUrl.pathname.startsWith("/book") ||
    nextUrl.pathname.startsWith("/admin");

  if (!isProtected) return NextResponse.next();

  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (!hasSession) {
    const signInUrl = new URL("/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
