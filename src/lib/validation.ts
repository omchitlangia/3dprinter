import { z } from "zod";

import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES } from "./uploads";

/**
 * Booking creation. The file has already been uploaded to object storage via a
 * presigned URL; the client sends the resulting key + metadata, which we
 * re-validate server-side (never trust the client's claim about the key path
 * shape, size, or name).
 */
export const createBookingSchema = z.object({
  printerId: z.string().cuid(),
  // ISO datetime string; coerced to Date and required to be in the future.
  start: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .transform((s) => new Date(s))
    .refine((d) => !Number.isNaN(d.getTime()), "Invalid start time")
    .refine((d) => d.getTime() > Date.now(), "Start time must be in the future"),
  estimatedDuration: z
    .number()
    .int()
    .min(5, "Duration must be at least 5 minutes")
    .max(72 * 60, "Duration too long"),
  material: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
  notes: z.string().max(2000).optional().nullable(),

  fileKey: z
    .string()
    .min(1)
    .max(300)
    // Must match the key shape our presigner produces: uploads/<userId>/<uuid>.<ext>
    .regex(
      new RegExp(`^uploads/[\\w-]+/[\\w-]+\\.(${ALLOWED_EXTENSIONS.join("|")})$`),
      "Invalid file reference"
    ),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// The status values an admin may transition a booking to.
export const ADMIN_SETTABLE_STATUSES = [
  "confirmed",
  "printing",
  "ready_for_pickup",
  "completed",
  "cancelled",
  "rejected",
] as const;

export const updateStatusSchema = z.object({
  bookingId: z.string().cuid(),
  status: z.enum(ADMIN_SETTABLE_STATUSES),
  reason: z.string().max(500).optional().nullable(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const cancelBookingSchema = z.object({
  bookingId: z.string().cuid(),
  reason: z.string().max(500).optional().nullable(),
});

// Listing filters for the admin dashboard.
export const listFilterSchema = z.object({
  status: z
    .enum([
      "confirmed",
      "printing",
      "ready_for_pickup",
      "completed",
      "cancelled",
      "rejected",
    ])
    .optional(),
  printerId: z.string().cuid().optional(),
  q: z.string().max(100).optional(),
});
