import Link from "next/link";
import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/guards";
import { SignOutButton } from "./auth-buttons";

export async function SiteHeader() {
  const session = await getSession();
  const user = session?.user;

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Printer className="h-5 w-5" />
          <span>COE 3D Print</span>
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
