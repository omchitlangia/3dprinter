import localFont from "next/font/local";

/**
 * Self-hosted variable fonts (latin subset) — committed under src/app/fonts so the
 * build never depends on reaching Google Fonts. Exposed as CSS variables that
 * Tailwind maps to `font-sans` (body) and `font-display` (headings).
 *
 * Space Grotesk — geometric/technical display face for big confident headings.
 * Inter — clean, highly legible body face.
 */
export const fontDisplay = localFont({
  src: "./fonts/SpaceGrotesk.woff2",
  variable: "--font-display",
  weight: "300 700",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});

export const fontSans = localFont({
  src: "./fonts/Inter.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Helvetica", "Arial", "sans-serif"],
});
