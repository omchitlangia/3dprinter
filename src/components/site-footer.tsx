import Image from "next/image";
import Link from "next/link";

const EXPLORE = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About the printer" },
  { href: "/gallery", label: "Gallery" },
  { href: "/book", label: "Book a print" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-brand-hairline bg-brand-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Image
            src="/logo.png"
            alt="Shiv Nadar Institution of Eminence — AI Centre of Excellence"
            width={2048}
            height={464}
            className="h-10 w-auto"
          />
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            The AI Centre of Excellence 3D-Printing Lab at the Shiv Nadar
            Institution of Eminence (Delhi NCR). From idea to object — student
            projects, research prototypes, and one-off makes.
          </p>
        </div>

        <nav aria-label="Footer" className="md:justify-self-end">
          <h2 className="font-display text-sm font-semibold text-brand-ink">
            Explore
          </h2>
          <ul className="mt-3 space-y-2">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-600 transition-colors hover:text-brand-teal"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-brand-hairline">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {year} AI Centre of Excellence · Shiv Nadar Institution of Eminence
          </p>
          <p>
            Built by{" "}
            <a
              href="https://therooster.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 transition-colors hover:text-brand-teal"
            >
              RoosterDev
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
