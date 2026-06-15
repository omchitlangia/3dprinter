import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// A booking occupies [start, endsAt). Statuses that hold a slot:
export const ACTIVE_BOOKING_STATUSES = [
  "confirmed",
  "printing",
  "ready_for_pickup",
] as const;

export function computeEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60_000);
}

/** Minutes from local midnight, in the lab timezone (Asia/Kolkata). */
function minutesIntoDay(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}

/** True if [start, end) lies within the printer's daily operating window. */
export function withinOperatingWindow(
  printer: { openMinute: number; closeMinute: number },
  start: Date,
  end: Date
): boolean {
  const s = minutesIntoDay(start);
  const e = minutesIntoDay(end);
  // Reject bookings that span past midnight (end-of-day wrap) — keep it simple
  // and within a single operating day.
  if (e <= s) return false;
  return s >= printer.openMinute && e <= printer.closeMinute;
}

/**
 * Returns true if the proposed [start, end) interval is free on the printer:
 * no overlap with an active booking and no overlap with a maintenance window.
 * Two intervals overlap iff start < other.end AND end > other.start.
 *
 * Accepts a transaction client so the check can run inside the same
 * transaction as the insert (guards against race conditions).
 */
export async function isSlotAvailable(
  client: PrismaClient | Prisma.TransactionClient,
  args: { printerId: string; start: Date; end: Date; ignoreBookingId?: string }
): Promise<boolean> {
  const { printerId, start, end, ignoreBookingId } = args;

  const conflictingBooking = await client.booking.findFirst({
    where: {
      printerId,
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      status: { in: ACTIVE_BOOKING_STATUSES as unknown as any },
      start: { lt: end },
      endsAt: { gt: start },
    },
    select: { id: true },
  });
  if (conflictingBooking) return false;

  const conflictingMaintenance = await client.maintenanceWindow.findFirst({
    where: {
      printerId,
      start: { lt: end },
      end: { gt: start },
    },
    select: { id: true },
  });
  return !conflictingMaintenance;
}

export interface AvailablePrinter {
  id: string;
  name: string;
  model: string | null;
  location: string | null;
  materials: string[];
  colors: string[];
  openMinute: number;
  closeMinute: number;
}

/**
 * Printers that are `available` and compatible with the requested material and
 * (optionally) color. Offline/maintenance printers are excluded.
 */
export async function compatiblePrinters(args: {
  material: string;
  color?: string;
}): Promise<AvailablePrinter[]> {
  return prisma.printer.findMany({
    where: {
      status: "available",
      materials: { has: args.material },
      ...(args.color ? { colors: { has: args.color } } : {}),
    },
    select: {
      id: true,
      name: true,
      model: true,
      location: true,
      materials: true,
      colors: true,
      openMinute: true,
      closeMinute: true,
    },
    orderBy: { name: "asc" },
  });
}
