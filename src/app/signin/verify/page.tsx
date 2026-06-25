import { MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth-card";

export default function VerifyRequestPage() {
  return (
    <AuthShell>
      <div className="rounded-2xl border border-brand-hairline bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-teal/10 text-brand-teal">
          <MailCheck className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold tracking-tight text-brand-ink">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          A sign-in link has been sent to your email address. It expires in 15
          minutes and can be used once.
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Didn&apos;t get it? Check spam, or request a new link from the sign-in
          page.
        </p>
      </div>
    </AuthShell>
  );
}
