"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "../auth/guards";
import {
  ACTIVE_BOOKING_STATUSES,
  compatiblePrinters,
  type AvailablePrinter,
} from "../booking/scheduling";

const querySchema = z.object({
  material: z.string().min(1).max(50),
  color: z.string().min(1).max(50).optional(),
});

export interface BusyInterval {
  start: string; // ISO
  end: string; // ISO
  kind: "booking" | "maintenance";
}

export interface PrinterWithBusy extends AvailablePrinter {
  busy: BusyInterval[];
}

/**
 * Returns compatible, available printers plus their busy intervals (active
 * bookings + maintenance windows) for the next 14 days, so the client can
 * render a picker and pre-filter obviously-taken slots. The server still
 * re-validates on submit — this is purely to guide the UI.
 */
export async function getCompatiblePrinters(
  input: unknown
): Promise<{ ok: true; printers: PrinterWithBusy[] } | { ok: false; error: string }> {
  await requireUser();

  const parsed = querySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid query" };

  const printers = await compatiblePrinters(parsed.data);
  if (printers.length === 0) return { ok: true, printers: [] };

  const horizonStart = new Date();
  const horizonEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const printerIds = printers.map((p) => p.id);

  const [bookings, maintenance] = await Promise.all([
    prisma.booking.findMany({
      where: {
        printerId: { in: printerIds },
        status: { in: ACTIVE_BOOKING_STATUSES as unknown as any },
        endsAt: { gt: horizonStart },
        start: { lt: horizonEnd },
      },
      select: { printerId: true, start: true, endsAt: true },
    }),
    prisma.maintenanceWindow.findMany({
      where: {
        printerId: { in: printerIds },
        end: { gt: horizonStart },
        start: { lt: horizonEnd },
      },
      select: { printerId: true, start: true, end: true },
    }),
  ]);

  const busyByPrinter = new Map<string, BusyInterval[]>();
  for (const b of bookings) {
    const arr = busyByPrinter.get(b.printerId) ?? [];
    arr.push({ start: b.start.toISOString(), end: b.endsAt.toISOString(), kind: "booking" });
    busyByPrinter.set(b.printerId, arr);
  }
  for (const m of maintenance) {
    const arr = busyByPrinter.get(m.printerId) ?? [];
    arr.push({ start: m.start.toISOString(), end: m.end.toISOString(), kind: "maintenance" });
    busyByPrinter.set(m.printerId, arr);
  }

  return {
    ok: true,
    printers: printers.map((p) => ({ ...p, busy: busyByPrinter.get(p.id) ?? [] })),
  };
}
