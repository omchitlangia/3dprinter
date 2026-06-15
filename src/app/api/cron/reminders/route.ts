import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { sendBookingReminder } from "@/server/email/send";

// This route only READS the request to decide what to send; it is invoked via
// POST by a cron job so it is never a mutating GET.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Constant-time bearer-token check against CRON_SECRET. */
function authorized(req: Request): boolean {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const a = Buffer.from(token);
  const b = Buffer.from(env.CRON_SECRET);
  // timingSafeEqual requires equal lengths.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Sends 24h-before and 1h-before reminders for upcoming confirmed bookings.
 * Idempotent: each window has a `reminderXSent` flag, set in the same update,
 * so re-runs (cron retries, overlapping schedules) don't double-send.
 *
 * Trigger: cron POSTs every ~15 minutes with `Authorization: Bearer <CRON_SECRET>`.
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const results = { reminder24: 0, reminder1: 0 };

  // 24h window: bookings starting within the next 24h that haven't had a 24h
  // reminder yet. (A reminder is "due" once start is within 24h.)
  const due24 = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      reminder24Sent: false,
      start: { gt: new Date(now), lte: new Date(now + 24 * 60 * 60 * 1000) },
    },
    include: { printer: true, user: true },
  });
  for (const b of due24) {
    await sendBookingReminder(b, "24h");
    await prisma.booking.update({
      where: { id: b.id },
      data: { reminder24Sent: true },
    });
    results.reminder24++;
  }

  // 1h window: bookings starting within the next hour without a 1h reminder.
  const due1 = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      reminder1Sent: false,
      start: { gt: new Date(now), lte: new Date(now + 60 * 60 * 1000) },
    },
    include: { printer: true, user: true },
  });
  for (const b of due1) {
    await sendBookingReminder(b, "1h");
    await prisma.booking.update({
      where: { id: b.id },
      // Also flip the 24h flag — within the hour, the 24h reminder is moot.
      data: { reminder1Sent: true, reminder24Sent: true },
    });
    results.reminder1++;
  }

  return NextResponse.json({ ok: true, ...results });
}
