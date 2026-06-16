import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";
import { ApplicationForm } from "./application-form";

export default async function ApplyPage() {
  const user = await requireUserPage();

  // One active application per user: if they already have a PENDING one, block
  // a new submission and tell them clearly.
  const pending = await prisma.application.findFirst({
    where: { userId: user.id, status: "PENDING" },
    select: { id: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New print application</h1>
        <p className="text-muted-foreground">
          Upload your model, choose a filament, and propose three days. An admin
          will review and confirm one of your days.
        </p>
      </div>

      {pending ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-6 text-sm text-amber-900">
          <p className="font-medium">You already have an application awaiting review.</p>
          <p className="mt-1">
            You can submit a new one once it&apos;s approved or rejected. Track it on{" "}
            <Link href="/applications" className="underline">
              My applications
            </Link>
            .
          </p>
        </div>
      ) : (
        <ApplicationForm />
      )}
    </div>
  );
}
