"use client";

import type { BookingStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Loader2, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminUpdateStatus } from "@/server/actions/admin";
import { getDownloadUrl } from "@/server/actions/download";

// Allowed transitions per current status (terminal states are locked).
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  confirmed: ["printing", "ready_for_pickup", "completed", "cancelled", "rejected"],
  printing: ["ready_for_pickup", "completed", "cancelled"],
  ready_for_pickup: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  rejected: [],
};

const LABEL: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  printing: "Start printing",
  ready_for_pickup: "Ready for pickup",
  completed: "Mark completed",
  cancelled: "Cancel",
  rejected: "Reject",
};

export function AdminBookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transitions = NEXT[status];

  function changeStatus(next: BookingStatus) {
    setError(null);
    startTransition(async () => {
      const reason =
        next === "rejected" || next === "cancelled"
          ? window.prompt(`Optional reason for "${LABEL[next]}":`) ?? undefined
          : undefined;
      const res = await adminUpdateStatus({ bookingId, status: next, reason });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  async function download() {
    setDownloading(true);
    setError(null);
    const res = await getDownloadUrl({ bookingId });
    setDownloading(false);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant="ghost"
        size="icon"
        onClick={download}
        disabled={downloading}
        title="Download model file"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending || transitions.length === 0}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Change status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {transitions.length === 0 ? (
            <DropdownMenuItem disabled>No actions (terminal)</DropdownMenuItem>
          ) : (
            transitions.map((s) => (
              <DropdownMenuItem
                key={s}
                onSelect={() => changeStatus(s)}
                className={
                  s === "cancelled" || s === "rejected" ? "text-destructive" : ""
                }
              >
                {LABEL[s]}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
