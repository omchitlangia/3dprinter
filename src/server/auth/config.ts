import type { NextAuthConfig } from "next-auth";

import { isAllowedEmail } from "@/lib/env";

/**
 * Edge-safe Auth.js config. Contains everything the middleware needs but no
 * Node-only dependencies (no Prisma adapter, no mailer). The full config in
 * `index.ts` extends this with the adapter and the magic-link email provider.
 *
 * Sign-in is MAGIC-LINK ONLY — there is no OAuth provider. The email provider
 * is added in the full (Node) config because it needs the SMTP mailer.
 */
export const authConfig = {
  providers: [
    // Magic-link email provider is added in the full (Node) config — it needs
    // the Nodemailer SMTP transport, which is Node-only.
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
     * allowlist. Returning a string redirects to that error page.
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
