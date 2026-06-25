import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck, ChevronDown, FileUp, Printer } from "lucide-react";

import { HeroVideo } from "@/components/marketing/hero-video";
import { Reveal } from "@/components/marketing/reveal";
import { GALLERY_ITEMS } from "@/lib/gallery";

const STEPS = [
  {
    icon: FileUp,
    title: "Submit",
    body: "Upload your model, pick a filament, and propose three days that work for you.",
  },
  {
    icon: CalendarCheck,
    title: "Review",
    body: "A lab admin reviews your request and confirms one of your proposed days.",
  },
  {
    icon: Printer,
    title: "Print",
    body: "We print it on the lab's machine and email you the moment it's decided.",
  },
];

export default function HomePage() {
  const teaser = GALLERY_ITEMS.slice(0, 4);

  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      {/* Full viewport height (100svh) so the video fills the screen with no
          bottom strip; -mt-16 cancels the layout's pt-16 so it sits flush under
          the fixed (overlaying) header. min-h floor keeps it usable on short. */}
      <section className="relative -mt-16 flex h-[100svh] min-h-[600px] w-full items-center overflow-hidden bg-brand-ink text-white">
        <HeroVideo />
        {/* Scrims: bottom-up for the fade into content + left-side for text contrast. */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14]/85 via-[#0B0F14]/40 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
              AI Centre of Excellence · Shiv Nadar Institution of Eminence
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              From idea to object.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
              Bring your model to the lab&apos;s high-speed 3D printer. Submit a
              request, get it reviewed, and pick it up — printed clean and ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-teal/20 transition-colors hover:bg-brand-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
              >
                Book a print <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                Explore the gallery
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
          <ChevronDown
            className="h-6 w-6 text-white/50 motion-safe:animate-float"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ─────────────────────── How it works ─────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-slate-600">
              A simple, reviewed pipeline — three steps from upload to pickup.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal
                key={step.title}
                delay={i * 90}
                className="relative rounded-2xl border border-brand-hairline bg-brand-surface p-7 shadow-sm"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <step.icon className="h-6 w-6" />
                </span>
                <p className="mt-5 font-display text-sm font-semibold uppercase tracking-wide text-brand-teal">
                  Step {i + 1}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-brand-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────── Gallery teaser ─────────────────────── */}
      <section className="bg-brand-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <Reveal>
              <h2 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
                Recent prints
              </h2>
              <p className="mt-3 max-w-lg text-slate-600">
                A look at what comes off the bed — figures, functional parts, and
                everything in between.
              </p>
            </Reveal>
            <Link
              href="/gallery"
              className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-teal hover:text-brand-teal-hover sm:inline-flex"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {teaser.map((item, i) => (
              <Reveal key={item.src} delay={i * 80}>
                <Link
                  href="/gallery"
                  className="group block overflow-hidden rounded-2xl border border-brand-hairline bg-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-md"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={item.src}
                      alt={item.alt}
                      width={1280}
                      height={1280}
                      loading="lazy"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="h-full w-full object-cover transition duration-500 motion-safe:group-hover:scale-[1.04]"
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 sm:hidden">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal"
            >
              View the full gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────── Closing CTA ─────────────────────── */}
      <section className="relative overflow-hidden bg-brand-ink text-white">
        <div className="absolute inset-0 bg-grid opacity-60" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Ready to print something?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Submit your model and propose three days. We&apos;ll review it and
              confirm a slot.
            </p>
            <Link
              href="/book"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-teal px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-teal/20 transition-colors hover:bg-brand-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
            >
              Book a print <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
