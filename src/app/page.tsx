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
          Apply to print at the COE 3D Print Lab
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Upload your model, choose a filament, and propose three days. An admin
          reviews each request and confirms a day. AI Center of Excellence, Shiv
          Nadar University.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {session?.user ? (
            <Button asChild>
              <Link href="/book">Start an application</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/signin">Sign in to apply</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <FileUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">1. Apply</CardTitle>
            <CardDescription>
              Upload your .stl / .3mf / .obj, pick a filament, and propose three
              days.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CalendarClock className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">2. Review</CardTitle>
            <CardDescription>
              An admin reviews your request and confirms one of your days.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Printer className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">3. Print</CardTitle>
            <CardDescription>
              You&apos;re emailed the decision and your confirmed day.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
