"use client";

import type { PrinterStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAddMaintenance, adminSetPrinterStatus } from "@/server/actions/admin";

export function PrinterControls({
  printerId,
  status,
}: {
  printerId: string;
  status: PrinterStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [mStart, setMStart] = useState("");
  const [mEnd, setMEnd] = useState("");
  const [mReason, setMReason] = useState("");
  const [savingM, setSavingM] = useState(false);

  function setStatus(next: PrinterStatus) {
    setError(null);
    startTransition(async () => {
      const res = await adminSetPrinterStatus({ printerId, status: next });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  async function addMaintenance(e: React.FormEvent) {
    e.preventDefault();
    if (!mStart || !mEnd) return;
    setSavingM(true);
    setError(null);
    const res = await adminAddMaintenance({
      printerId,
      start: new Date(mStart).toISOString(),
      end: new Date(mEnd).toISOString(),
      reason: mReason || null,
    });
    setSavingM(false);
    if (!res.ok) return setError(res.error);
    setMStart("");
    setMEnd("");
    setMReason("");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as PrinterStatus)}>
          <SelectTrigger className="h-9">
            <SelectValue />
            {pending && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">available</SelectItem>
            <SelectItem value="maintenance">maintenance</SelectItem>
            <SelectItem value="offline">offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={addMaintenance} className="space-y-2 rounded-md border p-2">
        <p className="text-xs font-medium">Add maintenance window</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[11px]">Start</Label>
            <Input
              type="datetime-local"
              value={mStart}
              onChange={(e) => setMStart(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px]">End</Label>
            <Input
              type="datetime-local"
              value={mEnd}
              onChange={(e) => setMEnd(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
        <Input
          placeholder="Reason (optional)"
          value={mReason}
          onChange={(e) => setMReason(e.target.value)}
          className="h-8 text-xs"
        />
        <Button type="submit" size="sm" variant="outline" disabled={savingM}>
          {savingM ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Add window
        </Button>
      </form>
    </div>
  );
}
