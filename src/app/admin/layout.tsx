import { requireAdminPage } from "@/server/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative admin gate (DB role). Middleware already requires a session.
  await requireAdminPage();
  return <>{children}</>;
}
