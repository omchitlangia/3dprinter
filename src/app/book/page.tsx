import Link from "next/link";
import { Clock } from "lucide-react";

import { Notice } from "@/components/notice";
import { PageHeader, PageShell } from "@/components/page-shell";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";
import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";
import { ApplicationForm } from "./application-form";

export default async function ApplyPage() {
  const user = await requireUserPage();

  // One active application per user: if they already have a PENDING one, block
  // a new submission and tell them clearly. Also read the stored name to
  // pre-fill the form for returning applicants.
  const [pending, dbUser] = await Promise.all([
    prisma.application.findFirst({
      where: { userId: user.id, status: "PENDING" },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    }),
  ]);

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        eyebrow="Book a print"
        title="New print application"
        description="Upload your model, choose a filament, and propose three days. An admin will review your request and confirm one of your days."
      />

      <div className="mt-8">
        {pending ? (
          <Notice
            tone="warning"
            icon={Clock}
            title="You already have an application awaiting review."
          >
            <p>
              You can submit a new one once it&apos;s approved or rejected. Track
              it on <Link href="/applications">My applications</Link>.
            </p>
          </Notice>
        ) : (
          <ApplicationForm
            initialName={dbUser?.name ?? ""}
            maxUploadBytes={MAX_UPLOAD_BYTES}
          />
        )}
      </div>
    </PageShell>
  );
}
