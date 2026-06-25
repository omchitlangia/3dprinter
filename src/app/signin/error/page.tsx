import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { AuthShell } from "@/components/auth-card";
import { Button } from "@/components/ui/button";

const MESSAGES: Record<string, string> = {
  AccessDenied:
    "Your email domain isn't permitted to use this system. Please sign in with your institutional account.",
  Verification: "The sign-in link is invalid or has expired. Request a new one.",
  Configuration: "There's a server configuration problem. Contact the lab admin.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ?? "Something went wrong during sign-in.";

  return (
    <AuthShell>
      <div className="rounded-2xl border border-brand-hairline bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-brand-ink">
          Sign-in failed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/signin">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </AuthShell>
  );
}
