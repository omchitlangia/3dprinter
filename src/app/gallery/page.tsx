import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GalleryGrid } from "@/components/marketing/gallery-grid";
import { Reveal } from "@/components/marketing/reveal";
import { GALLERY_ITEMS } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "A showcase of prints from the AI Centre of Excellence 3D-Printing Lab — figures, articulated models, functional parts, and more.",
};

export default function GalleryPage() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
            Gallery
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-brand-ink text-balance sm:text-5xl">
            Prints from the lab
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            A selection of recent work — from articulated creatures and detailed
            figures to functional, everyday parts. Click any print to view it
            larger.
          </p>
        </Reveal>

        <div className="mt-12">
          <GalleryGrid items={GALLERY_ITEMS} />
        </div>

        <Reveal className="mt-16 flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-hairline bg-brand-surface px-7 py-8 sm:flex-row">
          <div>
            <h2 className="font-display text-xl font-semibold text-brand-ink">
              Want yours in here?
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Bring a model to the lab — submit a request and propose three days.
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
          >
            Book a print <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
