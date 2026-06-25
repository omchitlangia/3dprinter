import Link from "next/link";
import { CheckCircle2, Inbox } from "lucide-react";

import { Notice } from "@/components/notice";
import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";
import { DownloadButton } from "./download-button";

export default async function MyApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await requireUserPage();
  const { submitted } = await searchParams;

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const hasPending = applications.some((a) => a.status === "PENDING");

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        eyebrow="Your requests"
        title="My applications"
        description="Track the status of every print request you've submitted."
        actions={
          <Button asChild disabled={hasPending}>
            <Link href="/book">New application</Link>
          </Button>
        }
      />

      <div className="mt-8 space-y-4">
        {submitted && (
          <Notice
            tone="success"
            icon={CheckCircle2}
            title="Application submitted — it's now pending review."
          >
            <p>
              We&apos;ve notified the lab and will email you once a decision is
              made.
            </p>
          </Notice>
        )}

        {hasPending && (
          <p className="text-sm text-slate-500">
            You have an application awaiting review — you can submit another once
            it&apos;s decided.
          </p>
        )}

        {applications.length === 0 ? (
          <div className="rounded-2xl border border-brand-hairline bg-white p-12 text-center shadow-sm">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-teal/10 text-brand-teal">
              <Inbox className="h-7 w-7" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-lg font-semibold text-brand-ink">
              No applications yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Submit your first print request to get started.
            </p>
            <Button asChild className="mt-6">
              <Link href="/book">Book a print</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-brand-hairline bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-base font-semibold text-brand-ink">
                      {a.filament} · {a.estimatedHours}h
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <span className="text-xs text-slate-500">
                    Submitted {formatDay(a.createdAt)}
                  </span>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {a.status === "APPROVED" && a.confirmedDate
                        ? "Confirmed day"
                        : "Requested days"}
                    </dt>
                    <dd className="mt-1 text-slate-700">
                      {a.status === "APPROVED" && a.confirmedDate ? (
                        <span className="font-medium text-emerald-700">
                          {formatDay(a.confirmedDate)}
                        </span>
                      ) : (
                        <>
                          {formatDay(a.preferredDate)} (preferred),{" "}
                          {formatDay(a.altDate1)}, {formatDay(a.altDate2)}
                        </>
                      )}
                    </dd>
                  </div>

                  {a.status === "REJECTED" && a.decisionNote && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Reason
                      </dt>
                      <dd className="mt-1 text-slate-700">{a.decisionNote}</dd>
                    </div>
                  )}

                  {a.status === "APPROVED" && a.decisionNote && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Note
                      </dt>
                      <dd className="mt-1 text-slate-700">{a.decisionNote}</dd>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      File
                    </dt>
                    <dd className="mt-1">
                      <DownloadButton
                        applicationId={a.id}
                        fileName={a.fileName}
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
