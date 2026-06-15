import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Records an admin override (status change, cancel, printer/maintenance edits).
 * Captures actor + timestamp (timestamp via the model's default(now())).
 * Accepts an optional transaction client so the log commits atomically with
 * the mutation it describes.
 */
export async function logAudit(
  entry: {
    actorId: string;
    action: string;
    bookingId?: string | null;
    detail?: string | null;
  },
  client: PrismaClient | Prisma.TransactionClient = prisma
): Promise<void> {
  await client.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      bookingId: entry.bookingId ?? null,
      detail: entry.detail ?? null,
    },
  });
}
