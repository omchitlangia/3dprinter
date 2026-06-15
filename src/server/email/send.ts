import "server-only";

import { render } from "@react-email/components";
import type { Booking, Printer, User } from "@prisma/client";

import { env } from "@/lib/env";
import { sendMail } from "@/lib/mailer";
import BookingConfirmed from "../../../emails/BookingConfirmed";
import BookingReminder from "../../../emails/BookingReminder";
import BookingStatus, { type StatusKind } from "../../../emails/BookingStatus";
import type { BookingInfo } from "../../../emails/components/BookingDetails";
import NewBookingAdmin from "../../../emails/NewBookingAdmin";

const APP_URL = env.NEXTAUTH_URL.replace(/\/$/, "");

function fmt(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function toInfo(booking: Booking, printer: Printer): BookingInfo {
  return {
    printerName: printer.name,
    startLabel: fmt(booking.start),
    durationMinutes: booking.estimatedDuration,
    material: booking.material,
    color: booking.color,
    fileName: booking.fileName,
    notes: booking.notes,
  };
}

type FullBooking = Booking & { printer: Printer; user: User };

/**
 * All sends are best-effort: a failed email must never roll back a committed
 * booking mutation. Callers log/ignore the result.
 */
async function safeSend(args: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  try {
    await sendMail({
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
  } catch (err) {
    console.error("[email] send failed:", args.subject, err);
  }
}

/** Booking confirmed → user. */
export async function sendBookingConfirmed(b: FullBooking): Promise<void> {
  const html = await render(
    BookingConfirmed({
      userName: b.user.name ?? b.user.email,
      booking: toInfo(b, b.printer),
      manageUrl: `${APP_URL}/bookings/${b.id}`,
    })
  );
  await safeSend({
    to: b.user.email,
    subject: "Your 3D print booking is confirmed",
    html,
  });
}

/** New booking → all admins. */
export async function sendNewBookingAdmin(b: FullBooking): Promise<void> {
  if (env.ADMIN_EMAILS.length === 0) return;
  const html = await render(
    NewBookingAdmin({
      requesterName: b.user.name ?? b.user.email,
      requesterEmail: b.user.email,
      booking: toInfo(b, b.printer),
      adminUrl: `${APP_URL}/admin`,
    })
  );
  await safeSend({
    to: env.ADMIN_EMAILS,
    subject: "New 3D print booking submitted",
    html,
  });
}

/** 24h / 1h reminder → user. */
export async function sendBookingReminder(
  b: FullBooking,
  window: "24h" | "1h"
): Promise<void> {
  const html = await render(
    BookingReminder({
      userName: b.user.name ?? b.user.email,
      window,
      booking: toInfo(b, b.printer),
      manageUrl: `${APP_URL}/bookings/${b.id}`,
    })
  );
  await safeSend({
    to: b.user.email,
    subject:
      window === "24h"
        ? "Reminder: your print slot is tomorrow"
        : "Reminder: your print slot is in ~1 hour",
    html,
  });
}

const STATUS_SUBJECT: Record<StatusKind, string> = {
  printing: "Your 3D print has started",
  ready_for_pickup: "Your 3D print is ready for pickup",
  cancelled: "Your 3D print booking was cancelled",
  rejected: "Your 3D print booking was rejected",
};

/** Status change → user. Only fires for the kinds with user-facing copy. */
export async function sendBookingStatus(
  b: FullBooking,
  kind: StatusKind,
  reason?: string | null
): Promise<void> {
  const html = await render(
    BookingStatus({
      userName: b.user.name ?? b.user.email,
      kind,
      booking: toInfo(b, b.printer),
      manageUrl: `${APP_URL}/bookings/${b.id}`,
      reason,
    })
  );
  await safeSend({ to: b.user.email, subject: STATUS_SUBJECT[kind], html });
}
