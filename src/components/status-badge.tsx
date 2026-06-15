import type { BookingStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const MAP: Record<
  BookingStatus,
  { label: string; variant: "success" | "info" | "warning" | "muted" | "destructive" }
> = {
  confirmed: { label: "Confirmed", variant: "info" },
  printing: { label: "Printing", variant: "warning" },
  ready_for_pickup: { label: "Ready for pickup", variant: "success" },
  completed: { label: "Completed", variant: "muted" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
