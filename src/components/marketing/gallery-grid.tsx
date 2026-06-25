"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { GalleryItem } from "@/lib/gallery";
import { cn } from "@/lib/utils";

/**
 * Responsive gallery grid + lightbox. Selected-index state lives here (page
 * level). Clicking a tile opens a shadcn Dialog (Radix — focus trap, Esc,
 * click-outside) with the larger image, title/subtitle, and prev/next nav
 * (buttons + ArrowLeft/ArrowRight). Hover lift respects reduced-motion via the
 * `motion-safe` variant.
 */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const open = selected !== null;
  const current = selected !== null ? items[selected] : null;

  const go = useCallback(
    (dir: 1 | -1) => {
      setSelected((i) => {
        if (i === null) return i;
        return (i + dir + items.length) % items.length;
      });
    },
    [items.length]
  );

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item, i) => (
          <li key={item.src}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`View ${item.title} — ${item.subtitle}`}
              className="group block w-full overflow-hidden rounded-2xl border border-brand-hairline bg-white text-left shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1280}
                  height={1280}
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-4">
                <p className="font-display text-sm font-semibold text-brand-ink">
                  {item.title}
                </p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={(o) => !o && setSelected(null)}>
        {current && (
          <DialogContent
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                go(1);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                go(-1);
              }
            }}
            className="max-w-5xl border-0 bg-brand-ink/95 p-0 text-white shadow-2xl backdrop-blur sm:rounded-2xl"
          >
            <div className="relative">
              <Image
                src={current.src}
                alt={current.alt}
                width={1280}
                height={1280}
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="mx-auto h-auto max-h-[78svh] w-auto rounded-t-2xl object-contain"
              />

              {/* Prev / next */}
              <NavButton side="left" onClick={() => go(-1)} />
              <NavButton side="right" onClick={() => go(1)} />
            </div>

            <div className="flex items-end justify-between gap-4 px-5 py-4">
              <div>
                <DialogTitle className="font-display text-lg font-semibold text-white">
                  {current.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-white/70">
                  {current.subtitle}
                </DialogDescription>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-white/50">
                {(selected ?? 0) + 1} / {items.length}
              </span>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function NavButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous print" : "Next print"}
      className={cn(
        "absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white outline-none transition hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-brand-teal",
        side === "left" ? "left-3" : "right-3"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
