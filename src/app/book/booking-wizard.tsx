"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ALLOWED_EXTENSIONS } from "@/lib/uploads";
import { createBooking } from "@/server/actions/booking";
import { getCompatiblePrinters, type PrinterWithBusy } from "@/server/actions/availability";
import { getPresignedUpload } from "@/server/actions/upload";

interface SubmitState {
  material: string;
  color: string;
  estimatedDuration: number;
  notes: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
}

const ACCEPT = ALLOWED_EXTENSIONS.map((e) => "." + e).join(",");

export function BookingWizard({
  materials,
  colors,
}: {
  materials: string[];
  colors: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 state ──
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState<SubmitState | null>(null);

  // ── Step 2 state ──
  const [printers, setPrinters] = useState<PrinterWithBusy[]>([]);
  const [printerId, setPrinterId] = useState("");
  const [start, setStart] = useState("");
  const [booking, setBooking] = useState(false);

  // ── Step 1: upload file + capture params, then advance ──
  async function handleSubmitStep(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!file) return setError("Please choose a model file.");
    if (!material) return setError("Please select a material.");
    if (!color) return setError("Please select a color.");

    setUploading(true);
    try {
      // 1) request a presigned URL (server validates ext/MIME/size + authz)
      const presign = await getPresignedUpload({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      if (!presign.ok) {
        setUploading(false);
        return setError(presign.error);
      }

      // 2) upload directly to object storage — never via our server
      const put = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        setUploading(false);
        return setError("Upload failed. Please try again.");
      }

      const state: SubmitState = {
        material,
        color,
        estimatedDuration: Number(duration),
        notes,
        fileKey: presign.key,
        fileName: presign.fileName,
        fileSize: file.size,
      };
      setSubmitted(state);

      // 3) fetch compatible printers for the scheduling step
      const res = await getCompatiblePrinters({ material, color });
      if (!res.ok) {
        setUploading(false);
        return setError(res.error);
      }
      setPrinters(res.printers);
      setStep(2);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const selectedPrinter = printers.find((p) => p.id === printerId);

  /** Client-side pre-check so users get instant feedback; server re-validates. */
  function overlapsBusy(): string | null {
    if (!selectedPrinter || !start || !submitted) return null;
    const s = new Date(start).getTime();
    const e = s + submitted.estimatedDuration * 60_000;
    if (Number.isNaN(s)) return "Pick a valid start time.";
    if (s <= Date.now()) return "Start time must be in the future.";
    for (const b of selectedPrinter.busy) {
      const bs = new Date(b.start).getTime();
      const be = new Date(b.end).getTime();
      if (s < be && e > bs) {
        return b.kind === "maintenance"
          ? "That overlaps a maintenance window. Pick another time."
          : "That overlaps an existing booking. Pick another time.";
      }
    }
    return null;
  }

  // ── Step 2: confirm the booking ──
  async function handleConfirm() {
    if (!submitted || !printerId || !start) return;
    const overlap = overlapsBusy();
    if (overlap) return setError(overlap);

    setError(null);
    setBooking(true);
    try {
      const res = await createBooking({
        printerId,
        start: new Date(start).toISOString(),
        estimatedDuration: submitted.estimatedDuration,
        material: submitted.material,
        color: submitted.color,
        notes: submitted.notes || null,
        fileKey: submitted.fileKey,
        fileName: submitted.fileName,
        fileSize: submitted.fileSize,
      });
      if (!res.ok) {
        setBooking(false);
        // If the slot got taken, refresh availability so the picker updates.
        if (submitted) {
          const refreshed = await getCompatiblePrinters({
            material: submitted.material,
            color: submitted.color,
          });
          if (refreshed.ok) setPrinters(refreshed.printers);
        }
        return setError(res.error);
      }
      setStep(3);
    } catch {
      setBooking(false);
      setError("Could not create booking. Please try again.");
    }
  }

  // ── Render ──
  if (step === 3) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <CardTitle>Booking confirmed</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            We&apos;ve emailed you the details. You can view it any time.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/bookings")}>My bookings</Button>
            <Button variant="outline" onClick={() => router.refresh()}>
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <StepIndicator step={step} />

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1 · Submit your job</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitStep} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="file">Model file ({ACCEPT})</Label>
                <Input
                  id="file"
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Material</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="duration">Estimated duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={4320}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Layer height, infill, special handling…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                Upload &amp; continue
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2 · Pick a printer &amp; time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {printers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No available printers support {submitted.material} ·{" "}
                {submitted.color}. Try different settings.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Compatible printer</Label>
                  <Select value={printerId} onValueChange={setPrinterId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select printer" />
                    </SelectTrigger>
                    <SelectContent>
                      {printers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                          {p.location ? ` · ${p.location}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPrinter && (
                  <p className="text-xs text-muted-foreground">
                    Operating hours:{" "}
                    {fmtMinute(selectedPrinter.openMinute)}–
                    {fmtMinute(selectedPrinter.closeMinute)} (IST).{" "}
                    {selectedPrinter.busy.length} upcoming busy interval(s).
                  </p>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="start">Start time</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>

                {selectedPrinter && selectedPrinter.busy.length > 0 && (
                  <div className="rounded-md border bg-muted/40 p-3 text-xs">
                    <p className="mb-1 font-medium">Already booked / maintenance:</p>
                    <ul className="space-y-0.5 text-muted-foreground">
                      {selectedPrinter.busy.slice(0, 6).map((b, i) => (
                        <li key={i}>
                          {new Date(b.start).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            dateStyle: "short",
                            timeStyle: "short",
                          })}{" "}
                          → {new Date(b.end).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            timeStyle: "short",
                          })}{" "}
                          ({b.kind})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} disabled={booking}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={booking || !printerId || !start}
                  >
                    {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Confirm booking
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function fmtMinute(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Submit", "Schedule", "Done"];
  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium " +
                (active
                  ? "bg-primary text-primary-foreground"
                  : done
                    ? "bg-emerald-600 text-white"
                    : "bg-muted text-muted-foreground")
              }
            >
              {n}
            </span>
            <span className={active ? "font-medium" : "text-muted-foreground"}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="text-muted-foreground">·</span>}
          </div>
        );
      })}
    </div>
  );
}
