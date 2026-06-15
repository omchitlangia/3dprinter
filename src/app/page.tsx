import Link from "next/link";
import { CalendarClock, FileUp, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth/guards";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Book the COE 3D Print Lab
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Submit your model, pick a slot on a compatible printer, and get
          confirmed instantly. AI Center of Excellence, Shiv Nadar University.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {session?.user ? (
            <Button asChild>
              <Link href="/book">Start a booking</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/signin">Sign in to book</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <FileUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">1. Submit</CardTitle>
            <CardDescription>
              Upload your .stl / .3mf / .obj and print settings.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CalendarClock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">2. Schedule</CardTitle>
            <CardDescription>
              Pick a free slot on a compatible printer.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Printer className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">3. Print</CardTitle>
            <CardDescription>
              Auto-confirmed. We email you at every step.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
