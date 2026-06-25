"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { getDownloadUrl } from "@/server/actions/download";

/**
 * Lets an applicant download their own uploaded model file. Reuses the existing
 * owner-or-admin `getDownloadUrl` action (unchanged) to mint a short-lived
 * presigned URL, then opens it in a new tab.
 */
export function DownloadButton({
  applicationId,
  fileName,
}: {
  applicationId: string;
  fileName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    const res = await getDownloadUrl({ applicationId });
    setLoading(false);
    if (!res.ok) return setError(res.error);
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md font-medium text-brand-teal-hover transition-colors hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="break-all">{fileName}</span>
      </button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
