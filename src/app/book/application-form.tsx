"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";

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
import { todayInIST } from "@/lib/dates";
import { ALLOWED_EXTENSIONS } from "@/lib/uploads";
import { FILAMENT_TYPES } from "@/lib/validation";
import { createApplication } from "@/server/actions/application";
import { getPresignedUpload } from "@/server/actions/upload";

const ACCEPT = ALLOWED_EXTENSIONS.map((e) => "." + e).join(",");

export function ApplicationForm({ initialName = "" }: { initialName?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState(initialName);
  const [filament, setFilament] = useState("");
  const [hours, setHours] = useState("2");
  const [file, setFile] = useState<File | null>(null);

  const [preferred, setPreferred] = useState("");
  const [alt1, setAlt1] = useState("");
  const [alt2, setAlt2] = useState("");

  // Calendar minimum: the day AFTER today in IST (days must be in the future).
  const minDay = useMemo(() => {
    const today = todayInIST(); // YYYY-MM-DD
    const d = new Date(`${today}T00:00:00.000+05:30`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  function validateDates(): string | null {
    if (!preferred || !alt1 || !alt2) return "Please pick all three days.";
    const days = [preferred, alt1, alt2];
    if (new Set(days).size !== 3) return "The three days must all be different.";
    if (days.some((d) => d < minDay)) return "All three days must be in the future.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Please enter your name.");
    if (!file) return setError("Please choose a model file.");
    if (!filament) return setError("Please select a filament type.");
    const hoursNum = Number(hours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      return setError("Estimated hours must be greater than 0.");
    }
    const dateErr = validateDates();
    if (dateErr) return setError(dateErr);

    setSubmitting(true);
    try {
      // 1) presigned URL (server validates ext/MIME/size + authz)
      const presign = await getPresignedUpload({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
      });
      if (!presign.ok) {
        setSubmitting(false);
        return setError(presign.error);
      }

      // 2) upload directly to object storage — never via our server
      const put = await fetch(presign.url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        setSubmitting(false);
        return setError("Upload failed. Please try again.");
      }

      // 3) submit the application
      const res = await createApplication({
        name: name.trim(),
        filament,
        estimatedHours: hoursNum,
        fileKey: presign.key,
        fileName: presign.fileName,
        fileSize: file.size,
        preferredDate: preferred,
        altDate1: alt1,
        altDate2: alt2,
      });
      if (!res.ok) {
        setSubmitting(false);
        return setError(res.error);
      }
      // Redirect to the applications list; the new pending application shows
      // there. Keep `submitting` true so the button stays in its loading state
      // through the navigation. `?submitted=1` triggers a one-time success note.
      router.push("/applications?submitted=1");
      router.refresh();
    } catch {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Application details</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
              <Label>Filament type</Label>
              <Select value={filament} onValueChange={setFilament}>
                <SelectTrigger>
                  <SelectValue placeholder="Select filament" />
                </SelectTrigger>
                <SelectContent>
                  {FILAMENT_TYPES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Estimated hours</Label>
              <Input
                id="hours"
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-md border p-4">
            <legend className="px-1 text-sm font-medium">
              Requested days (3 distinct future days)
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor="preferred">Preferred day</Label>
              <Input
                id="preferred"
                type="date"
                min={minDay}
                value={preferred}
                onChange={(e) => setPreferred(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="alt1">Alternate day 1</Label>
                <Input
                  id="alt1"
                  type="date"
                  min={minDay}
                  value={alt1}
                  onChange={(e) => setAlt1(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alt2">Alternate day 2</Label>
                <Input
                  id="alt2"
                  type="date"
                  min={minDay}
                  value={alt2}
                  onChange={(e) => setAlt2(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            Submit application
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
