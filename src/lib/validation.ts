import { z } from "zod";

import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES } from "./uploads";

/** Filament types an applicant may request. Mirrors the Prisma `FilamentType`. */
export const FILAMENT_TYPES = ["PLA", "ABS", "PETG", "TPU"] as const;
export type FilamentType = (typeof FILAMENT_TYPES)[number];

/** Application statuses. Mirrors the Prisma `ApplicationStatus`. */
export const APPLICATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

// A requested day, as a calendar date string "YYYY-MM-DD". Parsed to a Date at
// the start of that day in IST (see toRequestedDate in lib/dates).
const dayString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date");

/**
 * Application creation. The file has already been uploaded to object storage via
 * a presigned URL; the client sends the resulting key + metadata, which we
 * re-validate server-side (never trust the client's claim about the key path
 * shape, size, or name).
 *
 * The three requested days must be DISTINCT and in the FUTURE — enforced here so
 * the rule is identical on every caller.
 */
export const createApplicationSchema = z
  .object({
    // The applicant's name. Magic-link sign-in captures no name, so we collect
    // it here and persist it to the user (shown in admin + emails).
    name: z
      .string()
      .trim()
      .min(1, "Please enter your name")
      .max(100, "Name is too long"),
    filament: z.enum(FILAMENT_TYPES),
    estimatedHours: z
      .number()
      .positive("Estimated hours must be greater than 0")
      .max(1000, "Estimated hours is unrealistically large"),

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

    preferredDate: dayString,
    altDate1: dayString,
    altDate2: dayString,
  })
  .refine(
    (d) =>
      new Set([d.preferredDate, d.altDate1, d.altDate2]).size === 3,
    { message: "The three requested days must all be different", path: ["altDate2"] }
  );

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

/**
 * Admin approval. The admin confirms WHICH of the applicant's three days to use
 * — identified by slot, not a free-form date, so the admin can never invent a
 * day. Defaults to the preferred day.
 */
export const REQUESTED_SLOTS = ["preferred", "alt1", "alt2"] as const;
export type RequestedSlot = (typeof REQUESTED_SLOTS)[number];

export const approveApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  slot: z.enum(REQUESTED_SLOTS).default("preferred"),
  note: z.string().max(500).optional().nullable(),
});

export type ApproveApplicationInput = z.infer<typeof approveApplicationSchema>;

/** Admin rejection — optional reason. */
export const rejectApplicationSchema = z.object({
  applicationId: z.string().cuid(),
  reason: z.string().max(500).optional().nullable(),
});

export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;

/** Listing filter for the admin review page. */
export const listFilterSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
});
