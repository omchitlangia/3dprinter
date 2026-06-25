import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Centered shell for the auth screens (sign-in, verify, error). Light surface
 * that fills the viewport below the fixed header, with a single capped column
 * so the branded card sits in the optical centre on every screen size.
 */
export function AuthShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className="bg-brand-surface">
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-md place-items-center px-4 py-16 sm:px-6">
        <div className={cn("w-full", className)}>{children}</div>
      </div>
    </section>
  );
}
