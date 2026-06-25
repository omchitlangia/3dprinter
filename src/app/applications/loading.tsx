import { PageHeader, PageShell } from "@/components/page-shell";

/**
 * Streaming fallback while the applications list loads. Pure-CSS skeleton (no
 * deps) that mirrors the real layout to avoid layout shift.
 */
export default function LoadingApplications() {
  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        eyebrow="Your requests"
        title="My applications"
        description="Track the status of every print request you've submitted."
      />

      <div className="mt-8 space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-brand-hairline bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-24 animate-pulse rounded-full bg-slate-200" />
              </div>
              <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading your applications…</span>
    </PageShell>
  );
}
