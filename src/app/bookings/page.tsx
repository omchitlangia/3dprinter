import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";

export default async function MyBookingsPage() {
  const user = await requireUserPage();

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { printer: true },
    orderBy: { start: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My bookings</h1>
        <Button asChild>
          <Link href="/book">New booking</Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No bookings yet.{" "}
            <Link href="/book" className="underline">
              Create one
            </Link>
            .
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`}>
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{b.printer.name}</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(b.start)} · {formatDuration(b.estimatedDuration)} ·{" "}
                      {b.material} / {b.color}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">→</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
