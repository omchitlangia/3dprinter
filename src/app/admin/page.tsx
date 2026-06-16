import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application review</h1>
        <p className="text-muted-foreground">
          Approve (confirm one of the requested days) or reject print applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications</CardTitle>
          <AdminFilters current={{ status: f.status }} />
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No applications match this filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                      <div className="font-medium">{a.applicant.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
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
                          <div className="text-muted-foreground">
                            {formatDay(a.altDate1)}
                          </div>
                          <div className="text-muted-foreground">
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
                        days={[
                          {
                            slot: "preferred",
                            label: "preferred",
                            day: formatDay(a.preferredDate),
                          },
                          {
                            slot: "alt1",
                            label: "alternate 1",
                            day: formatDay(a.altDate1),
                          },
                          {
                            slot: "alt2",
                            label: "alternate 2",
                            day: formatDay(a.altDate2),
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
