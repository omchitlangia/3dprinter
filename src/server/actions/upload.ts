"use server";

import { uploadLimiter } from "@/lib/ratelimit";
import { presignRequestSchema, validateUpload } from "@/lib/uploads";
import { requireUser } from "../auth/guards";
import { createPresignedUpload } from "../storage/s3";

export type PresignResult =
  | { ok: true; url: string; key: string; fileName: string }
  | { ok: false; error: string };

/**
 * Issues a presigned upload URL. Mutating-ish (creates intent to store), so it
 * runs as a server action, not a GET. Validates authn, rate limit, Zod, and
 * the file allowlist (extension + MIME + size) before signing anything.
 */
export async function getPresignedUpload(input: unknown): Promise<PresignResult> {
  const user = await requireUser();

  const { success } = await uploadLimiter.limit(user.id);
  if (!success) {
    return { ok: false, error: "Too many upload requests. Slow down a moment." };
  }

  const parsed = presignRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  const check = validateUpload(parsed.data);
  if (!check.ok) {
    return { ok: false, error: check.error };
  }

  const { url, key } = await createPresignedUpload({
    userId: user.id,
    ext: check.ext,
    contentType: parsed.data.contentType,
  });

  return { ok: true, url, key, fileName: parsed.data.filename };
}
