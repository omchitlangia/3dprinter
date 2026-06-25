"use client";

import Image from "next/image";

import { useReducedMotion } from "@/lib/use-reduced-motion";

/**
 * Decorative, full-bleed background media for the home hero. Autoplays a muted,
 * looping, inline video (required attrs for iOS autoplay). Under reduced-motion
 * it renders the poster still instead — no autoplay, no animation.
 *
 * The video is purely decorative → `aria-hidden`. Legibility of foreground text
 * is handled by the gradient scrim layered over this in the hero section.
 */
export function HeroVideo() {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <Image
        src="/hero/poster.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    );
  }

  return (
    <video
      className="absolute inset-0 block h-full w-full object-cover"
      poster="/hero/poster.jpg"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    >
      <source src="/hero/hero.webm" type="video/webm" />
      <source src="/hero/hero.mp4" type="video/mp4" />
    </video>
  );
}
