"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "../auth/guards";
import { createPresignedDownload } from "../storage/s3";

const schema = z.object({ bookingId: z.string().cuid() });

/**
 * Issues a short-lived presigned download URL for a booking's model file.
 * Owner-or-admin only; the object is otherwise private.
 */
export async function getDownloadUrl(
  input: unknown
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    select: { userId: true, fileKey: true, fileName: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };
  if (booking.userId !== user.id && user.role !== "admin") {
    return { ok: false, error: "Not allowed" };
  }

  const url = await createPresignedDownload({
    key: booking.fileKey,
    fileName: booking.fileName,
  });
  return { ok: true, url };
}
