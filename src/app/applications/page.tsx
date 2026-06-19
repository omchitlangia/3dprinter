import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My applications</h1>
        <Button asChild disabled={hasPending}>
          <Link href="/book">New application</Link>
        </Button>
      </div>

      {submitted && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Application submitted — it&apos;s now pending review. We&apos;ve notified
          the lab and will email you once a decision is made.
        </div>
      )}

      {hasPending && (
        <p className="text-sm text-muted-foreground">
          You have an application awaiting review — you can submit another once
          it&apos;s decided.
        </p>
      )}

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No applications yet.{" "}
            <Link href="/book" className="underline">
              Submit one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-3 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {a.filament} · {a.estimatedHours}h
                    </span>
                    <StatusBadge status={a.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDay(a.createdAt)}
                  </span>
                </div>

                <div className="text-sm text-muted-foreground">
                  {a.status === "APPROVED" && a.confirmedDate ? (
                    <p>
                      <span className="font-medium text-foreground">
                        Confirmed day:
                      </span>{" "}
                      {formatDay(a.confirmedDate)}
                    </p>
                  ) : (
                    <p>
                      <span className="font-medium text-foreground">
                        Requested days:
                      </span>{" "}
                      {formatDay(a.preferredDate)} (preferred),{" "}
                      {formatDay(a.altDate1)}, {formatDay(a.altDate2)}
                    </p>
                  )}
                  {a.status === "REJECTED" && a.decisionNote && (
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Reason:</span>{" "}
                      {a.decisionNote}
                    </p>
                  )}
                  {a.status === "APPROVED" && a.decisionNote && (
                    <p className="mt-1">
                      <span className="font-medium text-foreground">Note:</span>{" "}
                      {a.decisionNote}
                    </p>
                  )}
                  <p className="mt-1 text-xs">File: {a.fileName}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
