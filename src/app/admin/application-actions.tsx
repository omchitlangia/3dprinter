"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Download, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adminApprove, adminReject } from "@/server/actions/admin";
import { getDownloadUrl } from "@/server/actions/download";
import type { RequestedSlot } from "@/lib/validation";

interface DayChoice {
  slot: RequestedSlot;
  label: string;
  day: string;
}

export function ApplicationActions({
  applicationId,
  status,
  days,
}: {
  applicationId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  days: DayChoice[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [slot, setSlot] = useState<RequestedSlot>("preferred");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");

  async function download() {
    setDownloading(true);
    setError(null);
    const res = await getDownloadUrl({ applicationId });
    setDownloading(false);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await adminApprove({
        applicationId,
        slot,
        note: note.trim() || null,
      });
      if (!res.ok) setError(res.error);
      else {
        setApproveOpen(false);
        router.refresh();
      }
    });
  }

  function reject() {
    setError(null);
    startTransition(async () => {
      const res = await adminReject({
        applicationId,
        reason: reason.trim() || null,
      });
      if (!res.ok) setError(res.error);
      else {
        setRejectOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {error && <span className="mr-1 text-xs text-destructive">{error}</span>}

      <Button
        variant="ghost"
        size="icon"
        onClick={download}
        disabled={downloading}
        title="Download model file"
        aria-label="Download model file"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>

      {status === "PENDING" && (
        <>
          {/* Approve */}
          <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-brand-teal/40 text-brand-teal-hover hover:bg-brand-teal/5 hover:text-brand-teal-hover"
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Approve application</DialogTitle>
                <DialogDescription>
                  Confirm which of the applicant&apos;s requested days to use.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  {days.map((d) => (
                    <label
                      key={d.slot}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
                        slot === d.slot
                          ? "border-brand-teal bg-brand-teal/5"
                          : "border-brand-hairline hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="confirmDay"
                        className="h-4 w-4 accent-brand-teal"
                        checked={slot === d.slot}
                        onChange={() => setSlot(d.slot)}
                      />
                      <span className="font-medium text-brand-ink">{d.day}</span>
                      <span className="text-slate-500">({d.label})</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="approve-note">Note (optional)</Label>
                  <Textarea
                    id="approve-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything the applicant should know…"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={approve} disabled={pending}>
                  {pending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-4 w-4" />
                  )}
                  Confirm approval
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Reject */}
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject application</DialogTitle>
                <DialogDescription>
                  Optionally tell the applicant why. They&apos;ll be emailed.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="reject-reason">Reason (optional)</Label>
                <Textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. file isn't printable as submitted…"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={reject}
                  disabled={pending}
                >
                  {pending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-1 h-4 w-4" />
                  )}
                  Confirm rejection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
