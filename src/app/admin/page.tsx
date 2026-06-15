import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { listFilterSchema } from "@/lib/validation";
import { AdminBookingActions } from "./booking-actions";
import { AdminFilters } from "./filters";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const filters = listFilterSchema.safeParse({
    status: sp.status,
    printerId: sp.printerId,
    q: sp.q,
  });
  const f = filters.success ? filters.data : {};

  const printers = await prisma.printer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      status: f.status,
      printerId: f.printerId,
      ...(f.q
        ? {
            OR: [
              { user: { email: { contains: f.q, mode: "insensitive" } } },
              { user: { name: { contains: f.q, mode: "insensitive" } } },
              { fileName: { contains: f.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { printer: true, user: true },
    orderBy: { start: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="text-muted-foreground">
            Manage bookings and printer status.
          </p>
        </div>
        <Link href="/admin/printers" className="text-sm underline">
          Printers &amp; maintenance →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bookings</CardTitle>
          <AdminFilters
            printers={printers}
            current={{ status: f.status, printerId: f.printerId, q: f.q }}
          />
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No bookings match these filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Printer</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium">{b.user.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{b.user.email}</div>
                    </TableCell>
                    <TableCell>{b.printer.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDateTime(b.start)}</TableCell>
                    <TableCell>{formatDuration(b.estimatedDuration)}</TableCell>
                    <TableCell>
                      {b.material} / {b.color}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={b.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <AdminBookingActions
                        bookingId={b.id}
                        status={b.status}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Printers</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {printers.map((p) => (
            <Badge
              key={p.id}
              variant={
                p.status === "available"
                  ? "success"
                  : p.status === "maintenance"
                    ? "warning"
                    : "muted"
              }
            >
              {p.name}: {p.status}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
