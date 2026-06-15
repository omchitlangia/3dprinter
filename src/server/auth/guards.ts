import "server-only";

import { redirect } from "next/navigation";

import { auth } from "./index";

/** Returns the session or null. */
export async function getSession() {
  return auth();
}

/** Throws (for server actions) if not signed in; returns the user otherwise. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHENTICATED");
  }
  return session.user;
}

/** Throws if not an admin. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** For server components / pages: redirect to sign-in if unauthenticated. */
export async function requireUserPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return session.user;
}

/** For pages: redirect home if not an admin. */
export async function requireAdminPage() {
  const user = await requireUserPage();
  if (user.role !== "admin") redirect("/");
  return user;
}
