"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion: reduce`. Returns `true` when the user has
 * asked the OS to minimize motion — callers then skip autoplay/animation and
 * render a still alternative. SSR-safe: starts `false`, updates on mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
