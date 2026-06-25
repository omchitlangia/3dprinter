import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "info" | "warning" | "success" | "error";

const TONES: Record<Tone, string> = {
  info: "border-brand-teal/30 bg-brand-teal/5 text-teal-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
};

const ICON_TONES: Record<Tone, string> = {
  info: "text-brand-teal",
  warning: "text-amber-600",
  success: "text-emerald-600",
  error: "text-destructive",
};

/**
 * Inline alert/banner used across the functional pages (pending notice, submit
 * confirmation, form errors). Links inside inherit a sensible underlined style.
 * `role` defaults to "status"; pass `role="alert"` for validation errors.
 */
export function Notice({
  tone = "info",
  icon: Icon,
  title,
  children,
  className,
  role = "status",
  id,
}: {
  tone?: Tone;
  icon?: LucideIcon;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
  role?: "status" | "alert";
  id?: string;
}) {
  return (
    <div
      id={id}
      role={role}
      className={cn(
        "flex gap-3 rounded-2xl border px-4 py-3.5 text-sm",
        TONES[tone],
        className
      )}
    >
      {Icon && (
        <Icon
          className={cn("mt-0.5 h-5 w-5 shrink-0", ICON_TONES[tone])}
          aria-hidden="true"
        />
      )}
      <div className="min-w-0 space-y-1 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
