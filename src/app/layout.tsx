import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: "COE 3D Print Lab — Applications",
  description:
    "Apply to print at the AI Center of Excellence 3D Print Lab, Shiv Nadar University.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-muted/30 antialiased">
        <Providers>
          <SiteHeader />
          <main className="container py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
