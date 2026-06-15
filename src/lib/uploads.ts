import { z } from "zod";

import { env } from "./env";

/**
 * Upload allowlist. We accept only 3D model files. Browsers report
 * inconsistent MIME types for these (often application/octet-stream), so we
 * validate BOTH the extension and the declared MIME against an allowlist, and
 * accept octet-stream as a fallback only when the extension matches.
 */
export const ALLOWED_EXTENSIONS = ["stl", "3mf", "obj"] as const;
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

// Known-good MIME types per extension, plus the generic binary fallback.
export const ALLOWED_MIME_BY_EXT: Record<AllowedExtension, string[]> = {
  stl: ["model/stl", "application/sla", "application/vnd.ms-pki.stl", "application/octet-stream"],
  "3mf": [
    "model/3mf",
    "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
    "application/octet-stream",
    "application/zip",
  ],
  obj: ["model/obj", "text/plain", "application/octet-stream"],
};

export const MAX_UPLOAD_BYTES = env.MAX_UPLOAD_BYTES;

function extensionOf(filename: string): string | null {
  const m = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : null;
}

/** Zod schema for a presigned-upload request from the client. */
export const presignRequestSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(200)
    // Block path traversal / weird chars in the display name.
    .regex(/^[\w\-. ()]+$/, "Filename contains invalid characters"),
  contentType: z.string().min(1).max(120),
  size: z
    .number()
    .int()
    .positive()
    .max(MAX_UPLOAD_BYTES, `File exceeds the ${MAX_UPLOAD_BYTES}-byte limit`),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;

/**
 * Validates filename/MIME/size against the allowlist. Returns the normalized
 * extension on success or an error message on failure.
 */
export function validateUpload(req: PresignRequest):
  | { ok: true; ext: AllowedExtension }
  | { ok: false; error: string } {
  const ext = extensionOf(req.filename);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    return {
      ok: false,
      error: `Only ${ALLOWED_EXTENSIONS.map((e) => "." + e).join(", ")} files are allowed`,
    };
  }
  const allowedMimes = ALLOWED_MIME_BY_EXT[ext as AllowedExtension];
  if (!allowedMimes.includes(req.contentType.toLowerCase())) {
    return { ok: false, error: `Content type "${req.contentType}" not allowed for .${ext}` };
  }
  if (req.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File too large" };
  }
  return { ok: true, ext: ext as AllowedExtension };
}
