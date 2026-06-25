import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared scaffold for the authed/functional pages (book, applications, admin).
 * A light surface section that always fills at least the viewport below the
 * fixed header (so short pages don't leave a white gap above the footer), with
 * a centered, width-capped content column. Pass `className` to set the max
 * width (e.g. `max-w-3xl` for forms, `max-w-6xl` for the admin table).
 */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className="bg-brand-surface">
      <div
        className={cn(
          "mx-auto min-h-[calc(100svh-4rem)] px-4 py-12 sm:px-6 lg:px-8 lg:py-16",
          className
        )}
      >
        {children}
      </div>
    </section>
  );
}

/**
 * Consistent page header: optional eyebrow, the page's single <h1> (display
 * face), an optional one-line description, and an optional actions slot
 * (rendered to the right on desktop, e.g. a "New application" button).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-brand-ink text-balance sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
