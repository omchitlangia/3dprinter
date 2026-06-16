import type { ApplicationStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

const MAP: Record<
  ApplicationStatus,
  { label: string; variant: "success" | "info" | "warning" | "muted" | "destructive" }
> = {
  PENDING: { label: "Pending review", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { label, variant } = MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}
