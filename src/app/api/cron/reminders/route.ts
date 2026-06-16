import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/lib/env";

// Invoked via POST by the cron sidecar; never a mutating GET.
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
 * Reminder endpoint. The application-review model has no time-based reminders
 * (an admin confirms a day manually), so there is nothing to send — but the
 * route is kept (and the bearer gate enforced) so the existing cron sidecar
 * keeps getting a healthy 200 and we can reintroduce reminders later without
 * changing the deployment.
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, reminders: 0 });
}
