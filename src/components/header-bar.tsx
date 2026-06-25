"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Box, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

type SessionUser = { email: string; role: string } | null;

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
];

export function HeaderBar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isHome = pathname === "/";
  // Transparent, light-on-dark only at the top of the home hero.
  const onDark = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const linkColor = onDark
    ? "text-white/80 hover:text-white"
    : "text-slate-600 hover:text-brand-ink";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        onDark
          ? "bg-transparent"
          : "border-b border-brand-hairline bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/70"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          aria-label="AI CoE · 3D Print — home"
          className="group flex items-center gap-2.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-teal to-brand-cyan text-white shadow-sm">
            <Box className="h-5 w-5" />
          </span>
          <span
            className={cn(
              "font-display text-base font-bold tracking-tight transition-colors",
              onDark ? "text-white" : "text-brand-ink"
            )}
          >
            AI CoE <span className="font-normal opacity-60">· 3D Print</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  linkColor,
                  active && (onDark ? "text-white" : "text-brand-ink")
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                <span
                  className={cn(
                    "mx-3 block h-px origin-left transition-transform",
                    active ? "scale-x-100" : "scale-x-0",
                    onDark ? "bg-white" : "bg-brand-teal"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Desktop auth + CTA */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/applications"
                className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", linkColor)}
              >
                My applications
              </Link>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", linkColor)}
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", linkColor)}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/signin"
              className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", linkColor)}
            >
              Sign in
            </Link>
          )}
          <Link
            href="/book"
            className="rounded-full bg-brand-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-teal-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2"
          >
            Book a print
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors md:hidden",
            onDark ? "text-white hover:bg-white/10" : "text-brand-ink hover:bg-slate-100"
          )}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu — accessible disclosure (no extra deps) */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-brand-hairline bg-white px-4 pb-6 pt-2 shadow-lg md:hidden"
        >
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-base font-medium text-brand-ink hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-brand-hairline" />
            {user ? (
              <>
                <Link href="/applications" className="rounded-md px-3 py-3 text-base font-medium text-brand-ink hover:bg-slate-50">
                  My applications
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="rounded-md px-3 py-3 text-base font-medium text-brand-ink hover:bg-slate-50">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-md px-3 py-3 text-left text-base font-medium text-brand-ink hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/signin" className="rounded-md px-3 py-3 text-base font-medium text-brand-ink hover:bg-slate-50">
                Sign in
              </Link>
            )}
            <Link
              href="/book"
              className="mt-2 rounded-full bg-brand-teal px-4 py-3 text-center text-base font-semibold text-white hover:bg-brand-teal-hover"
            >
              Book a print
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
