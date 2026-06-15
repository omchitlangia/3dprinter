import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, formatDuration } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";
import { CancelBookingButton } from "./cancel-button";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUserPage();
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { printer: true },
  });
  if (!booking) notFound();

  // Owner-or-admin can view.
  if (booking.userId !== user.id && user.role !== "admin") notFound();

  const cancellable = !["completed", "cancelled", "rejected"].includes(
    booking.status
  );

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{booking.printer.name}</CardTitle>
            <StatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Start" value={formatDateTime(booking.start)} />
          <Row label="Ends" value={formatDateTime(booking.endsAt)} />
          <Row label="Duration" value={formatDuration(booking.estimatedDuration)} />
          <Row label="Material / Color" value={`${booking.material} · ${booking.color}`} />
          <Row label="File" value={`${booking.fileName} (${(booking.fileSize / 1024 / 1024).toFixed(1)} MB)`} />
          {booking.notes && <Row label="Notes" value={booking.notes} />}
          <Row label="Location" value={booking.printer.location ?? "—"} />

          {cancellable && (
            <div className="pt-2">
              <CancelBookingButton bookingId={booking.id} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
