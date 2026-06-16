import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/guards";
import { SignOutButton } from "./auth-buttons";

export async function SiteHeader() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center" aria-label="COE 3D Print — home">
          {/* Logo lives at public/logo.png (2048×464). h-10 keeps it inside the
              16-unit header; w-auto preserves the wide aspect ratio. */}
          <Image
            src="/logo.png"
            alt="Shiv Nadar University — AI Center of Excellence"
            width={2048}
            height={464}
            priority
            className="h-10 w-auto"
          />
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/book">New application</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/applications">My applications</Link>
              </Button>
              {user.role === "admin" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/signin">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
