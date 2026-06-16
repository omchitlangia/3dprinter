const IST = "Asia/Kolkata";
// IST is a fixed +05:30 offset (no DST), so a day's start can be pinned exactly.
const IST_OFFSET = "+05:30";

/**
 * Convert a calendar day string "YYYY-MM-DD" to the Date at the START of that
 * day in IST. Stored as the canonical instant for a requested/confirmed day.
 */
export function requestedDateToInstant(day: string): Date {
  return new Date(`${day}T00:00:00.000${IST_OFFSET}`);
}

/** "YYYY-MM-DD" for the current day in IST (used as the min for date pickers). */
export function todayInIST(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: IST,
  }).format(new Date());
  return parts; // en-CA gives YYYY-MM-DD
}

/**
 * True when the day string is strictly AFTER today (IST) — i.e. a future day.
 * Comparison is lexical on YYYY-MM-DD, which is correct for ISO day strings.
 */
export function isFutureDay(day: string): boolean {
  return day > todayInIST();
}

/** Format a stored day instant as a readable day label in IST (e.g. "Mon, 23 Jun 2026"). */
export function formatDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: IST,
  }).format(d);
}
