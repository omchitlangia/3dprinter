import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { fontDisplay, fontSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI CoE 3D Print Lab — Shiv Nadar Institution of Eminence",
    template: "%s · AI CoE 3D Print Lab",
  },
  description:
    "From idea to object. The AI Centre of Excellence 3D-printing lab at the Shiv Nadar Institution of Eminence — apply to print, explore the gallery, and meet the machine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-background font-sans antialiased">
        {/* Without JS, IntersectionObserver never fires — keep reveal content visible. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
        <Providers>
          <SiteHeader />
          {/* pt-16 clears the fixed header; the home hero cancels it with -mt-16. */}
          <main className="flex-1 pt-16">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
