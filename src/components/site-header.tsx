import { getSession } from "@/server/auth/guards";
import { HeaderBar } from "./header-bar";

/**
 * Server wrapper: resolves the session, then hands a minimal, serializable
 * user shape to the client header (which owns scroll/adaptive styling + the
 * mobile menu). Shared across every route via the root layout.
 */
export async function SiteHeader() {
  const session = await getSession();
  const user = session?.user
    ? { email: session.user.email ?? "", role: session.user.role ?? "user" }
    : null;

  return <HeaderBar user={user} />;
}
