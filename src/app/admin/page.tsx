import { Inbox } from "lucide-react";

import { PageHeader, PageShell } from "@/components/page-shell";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
import { displayName } from "@/lib/display";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { listFilterSchema } from "@/lib/validation";
import { ApplicationActions } from "./application-actions";
import { AdminFilters } from "./filters";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = listFilterSchema.safeParse({ status: sp.status });
  const f = filters.success ? filters.data : {};

  const applications = await prisma.application.findMany({
    where: { status: f.status },
    include: { applicant: true },
    // Pending first (so reviewers see the queue), then newest.
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  // Build the day-choice list passed to the (unchanged) approve/reject actions.
  const daysFor = (a: (typeof applications)[number]) => [
    { slot: "preferred" as const, label: "preferred", day: formatDay(a.preferredDate) },
    { slot: "alt1" as const, label: "alternate 1", day: formatDay(a.altDate1) },
    { slot: "alt2" as const, label: "alternate 2", day: formatDay(a.altDate2) },
  ];

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        eyebrow="Admin"
        title="Application review"
        description="Approve (confirm one of the requested days) or reject print applications."
      />

      <div className="mt-8 overflow-hidden rounded-2xl border border-brand-hairline bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-brand-hairline p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-brand-ink">
              Applications
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {applications.length} shown
            </p>
          </div>
          <AdminFilters current={{ status: f.status }} />
        </div>

        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Inbox className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-5 text-sm text-slate-600">
              No applications match this filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop: real table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-brand-surface/60 hover:bg-brand-surface/60">
                    <TableHead>Applicant</TableHead>
                    <TableHead>Filament</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Requested / confirmed days</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium text-brand-ink">
                          {displayName(a.applicant)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {a.applicant.email}
                        </div>
                      </TableCell>
                      <TableCell>{a.filament}</TableCell>
                      <TableCell>{a.estimatedHours}h</TableCell>
                      <TableCell className="text-sm">
                        {a.status === "APPROVED" && a.confirmedDate ? (
                          <span className="font-medium text-emerald-700">
                            {formatDay(a.confirmedDate)} (confirmed)
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <div>{formatDay(a.preferredDate)} · preferred</div>
                            <div className="text-slate-500">
                              {formatDay(a.altDate1)}
                            </div>
                            <div className="text-slate-500">
                              {formatDay(a.altDate2)}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDateTime(a.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ApplicationActions
                          applicationId={a.id}
                          status={a.status}
                          days={daysFor(a)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: stacked cards */}
            <div className="space-y-3 p-4 md:hidden">
              {applications.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-brand-hairline p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-brand-ink">
                        {displayName(a.applicant)}
                      </div>
                      <div className="break-all text-xs text-slate-500">
                        {a.applicant.email}
                      </div>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">
                        Filament
                      </dt>
                      <dd className="text-slate-700">{a.filament}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-slate-400">
                        Hours
                      </dt>
                      <dd className="text-slate-700">{a.estimatedHours}h</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-400">
                        Requested / confirmed days
                      </dt>
                      <dd className="text-slate-700">
                        {a.status === "APPROVED" && a.confirmedDate ? (
                          <span className="font-medium text-emerald-700">
                            {formatDay(a.confirmedDate)} (confirmed)
                          </span>
                        ) : (
                          <>
                            {formatDay(a.preferredDate)} (preferred),{" "}
                            {formatDay(a.altDate1)}, {formatDay(a.altDate2)}
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-xs uppercase tracking-wide text-slate-400">
                        Submitted
                      </dt>
                      <dd className="text-slate-700">
                        {formatDateTime(a.createdAt)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex justify-end border-t border-brand-hairline pt-3">
                    <ApplicationActions
                      applicationId={a.id}
                      status={a.status}
                      days={daysFor(a)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
