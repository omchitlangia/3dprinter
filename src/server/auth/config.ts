import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { isAllowedEmail } from "@/lib/env";

/**
 * Edge-safe Auth.js config. Contains everything the middleware needs but no
 * Node-only dependencies (no Prisma adapter, no Resend). The full config in
 * `index.ts` extends this with the adapter and the email provider.
 */
export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Force account chooser so users on multiple Google accounts can pick the
      // institutional one.
      authorization: { params: { prompt: "select_account" } },
    }),
    // Email provider is added in the full (Node) config — it needs Resend.
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/signin/verify",
    error: "/signin/error",
  },
  // NOTE: `session.strategy` is intentionally NOT set here. Database sessions
  // require the Prisma adapter, which is Node-only and lives in the full config
  // (`index.ts`). The edge/middleware instance built from this config only does
  // a session-cookie presence check, so it must not declare the database
  // strategy (that would throw MissingAdapter in the edge runtime).
  callbacks: {
    /**
     * Gatekeeper for every sign-in. Reject any email whose domain isn't in the
     * allowlist — applies to BOTH Google and magic-link. Returning a string
     * redirects to that error page.
     */
    signIn({ user }) {
      if (!isAllowedEmail(user.email)) {
        return "/signin/error?error=AccessDenied";
      }
      return true;
    },
    /**
     * Authorization for middleware-protected routes. `auth` is null when signed
     * out. Admin gating for /admin happens in the layout (needs DB role), here
     * we just require a session.
     */
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
