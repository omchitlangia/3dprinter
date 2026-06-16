"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "../auth/guards";
import { createPresignedDownload } from "../storage/s3";

const schema = z.object({ applicationId: z.string().cuid() });

/**
 * Issues a short-lived presigned download URL for an application's model file.
 * Owner-or-admin only; the object is otherwise private.
 */
export async function getDownloadUrl(
  input: unknown
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const application = await prisma.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: { userId: true, fileKey: true, fileName: true },
  });
  if (!application) return { ok: false, error: "Application not found" };
  if (application.userId !== user.id && user.role !== "admin") {
    return { ok: false, error: "Not allowed" };
  }

  const url = await createPresignedDownload({
    key: application.fileKey,
    fileName: application.fileName,
  });
  return { ok: true, url };
}
