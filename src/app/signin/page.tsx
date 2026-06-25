import Image from "next/image";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth-card";
import { getSession } from "@/server/auth/guards";
import { SignInForm } from "./signin-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session?.user) redirect("/book");

  const { callbackUrl } = await searchParams;

  return (
    <AuthShell>
      <div className="rounded-2xl border border-brand-hairline bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Shiv Nadar Institution of Eminence — AI Centre of Excellence"
            width={2048}
            height={464}
            priority
            className="h-9 w-auto"
          />
          <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-brand-ink">
            Sign in
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            We&apos;ll email you a one-time magic link — no password needed.
          </p>
        </div>

        <div className="mt-6">
          <SignInForm callbackUrl={callbackUrl ?? "/book"} />
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-slate-500">
        Only{" "}
        <span className="font-medium text-slate-600">@snu.edu.in</span> accounts
        can sign in.
      </p>
    </AuthShell>
  );
}
