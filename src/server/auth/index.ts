import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { isAdminEmail, isAllowedEmail } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { magicLinkLimiter } from "@/lib/ratelimit";
import { sendMagicLink } from "../email/magic-link";
import { authConfig } from "./config";

/**
 * Full Node-runtime Auth.js setup. Extends the edge-safe `authConfig` with the
 * Prisma adapter and the email (magic-link) provider, which require Node APIs.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // Trust the deployment host. Required in production for self-hosted / behind
  // a reverse proxy (non-Vercel). The host is controlled by your infra, and
  // NEXTAUTH_URL pins the canonical origin for callbacks.
  trustHost: true,
  // Database sessions live here, alongside the adapter (Node runtime only).
  session: { strategy: "database" },
  providers: [
    ...authConfig.providers,
    // Custom email (magic-link) provider. We bring our own mailer (Resend), so
    // we use the generic "email" provider type and fully override delivery —
    // this avoids the nodemailer/SMTP dependency entirely.
    {
      id: "email",
      type: "email",
      name: "Email",
      from: process.env.EMAIL_FROM,
      maxAge: 15 * 60, // magic link valid 15 minutes
      // Required by the EmailConfig type; unused because we override delivery.
      server: {},
      options: {},
      async sendVerificationRequest({ identifier, url }) {
        // Domain allowlist + rate limit BEFORE we send anything. Throwing here
        // surfaces as a sign-in error instead of emitting a link.
        if (!isAllowedEmail(identifier)) {
          throw new Error("Email domain not allowed.");
        }
        const { success } = await magicLinkLimiter.limit(
          identifier.toLowerCase()
        );
        if (!success) {
          throw new Error("Too many sign-in requests. Try again later.");
        }
        await sendMagicLink({ identifier, url });
      },
    },
  ],
  events: {
    /**
     * Grant/sync the admin role on every sign-in based on the env allowlist.
     * Keeps DB role authoritative while letting ADMIN_EMAILS drive it.
     */
    async signIn({ user }) {
      if (!user.email) return;
      const shouldBeAdmin = isAdminEmail(user.email);
      const current = await prisma.user.findUnique({
        where: { email: user.email },
        select: { role: true },
      });
      const desired = shouldBeAdmin ? "admin" : current?.role ?? "user";
      if (current && current.role !== desired) {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: desired },
        });
      }
    },
  },
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Expose id + role on the session so server code can authorize without an
     * extra DB round-trip.
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // `role` is added to the adapter user via the model; read it through.
        const u = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        session.user.role = u?.role ?? "user";
      }
      return session;
    },
  },
});
