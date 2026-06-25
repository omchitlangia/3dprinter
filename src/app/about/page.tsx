import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  GraduationCap,
  Layers,
  Microscope,
  ShieldCheck,
  Target,
  Wrench,
  Zap,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";

export const metadata: Metadata = {
  title: "About the printer",
  description:
    "Meet the machine behind the AI Centre of Excellence 3D-Printing Lab — a high-speed, enclosed, multi-material printer built for student projects, research, and rapid prototyping.",
};

// TODO: confirm exact specs against the lab's actual machine before publishing.
// These are representative placeholders for a Creality K2 Plus-class printer —
// do not present as confirmed figures.
const SPECS = [
  { icon: Box, label: "Build volume", value: "Large-format", note: "≈ 350 × 350 × 350 mm" },
  { icon: Zap, label: "Print speed", value: "High-speed", note: "CoreXY motion" },
  { icon: Layers, label: "Materials", value: "Multi-material", note: "PLA · PETG · ABS · TPU" },
  { icon: ShieldCheck, label: "Chamber", value: "Fully enclosed", note: "Active heating" },
  { icon: Target, label: "Precision", value: "Auto-calibrated", note: "Auto bed leveling" },
  { icon: Wrench, label: "Reliability", value: "Lab-maintained", note: "Operated by staff" },
];

const AUDIENCE = [
  {
    icon: GraduationCap,
    title: "Students",
    body: "Course projects, club builds, and personal makes — bring an idea and leave with the object.",
  },
  {
    icon: Microscope,
    title: "Research",
    body: "Custom jigs, fixtures, and one-off parts for labs across the institution.",
  },
  {
    icon: Wrench,
    title: "Prototyping",
    body: "Iterate fast — functional prototypes and form studies, printed and reviewed in days.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-20 lg:px-8">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-teal">
              About the printer
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight tracking-tight text-brand-ink text-balance sm:text-5xl">
              The machine behind the magic
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              At the heart of the lab is a high-speed, enclosed, multi-material 3D
              printer — capable of large-format parts with a clean, consistent
              finish. It&apos;s maintained and operated by the AI Centre of Excellence
              team, so every job runs on a calibrated, reliable machine.
            </p>
            <div className="mt-8">
              <Link
                href="/book"
                className="inline-flex items-center gap-2 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
              >
                Book a print <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="overflow-hidden rounded-2xl border border-brand-hairline shadow-lg">
              <Image
                src="/about/printer.webp"
                alt="The lab's enclosed, high-speed 3D printer"
                width={1920}
                height={1434}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────── Specs / highlights ─────────────────────── */}
      <section className="bg-brand-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
              Highlights
            </h2>
            <p className="mt-3 text-slate-600">
              What makes it well-suited for everything from fine figures to
              functional parts.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SPECS.map((spec, i) => (
              <Reveal
                key={spec.label}
                delay={i * 70}
                className="rounded-2xl border border-brand-hairline bg-white p-6 shadow-sm"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <spec.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {spec.label}
                </p>
                <p className="font-display text-lg font-semibold text-brand-ink">
                  {spec.value}
                </p>
                <p className="mt-1 text-sm text-slate-500">{spec.note}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Specifications are indicative; exact figures are confirmed at the lab.
          </p>
        </div>
      </section>

      {/* ─────────────────────── Who it's for ─────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-ink sm:text-4xl">
              What we print — and who it&apos;s for
            </h2>
            <p className="mt-3 text-slate-600">
              The lab is open to the whole campus community.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {AUDIENCE.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 90}
                className="rounded-2xl border border-brand-hairline bg-brand-surface p-7 shadow-sm"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-teal/10 text-brand-teal">
                  <item.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-brand-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.body}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-14 flex flex-col items-center justify-between gap-4 rounded-2xl border border-brand-hairline bg-brand-ink px-7 py-8 text-white sm:flex-row">
            <div>
              <h3 className="font-display text-xl font-semibold">
                Have a model ready?
              </h3>
              <p className="mt-1 text-sm text-white/70">
                Submit it for review and propose three days.
              </p>
            </div>
            <Link
              href="/book"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
            >
              Book a print <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
