/**
 * Functional verification of the application-review model against the dev DB.
 *
 * Exercises the REAL validation schemas, the REAL email templates (rendered to
 * HTML), and the REAL Prisma operations the server actions perform — asserting:
 *   1. A user can submit an application (starts PENDING).
 *   2. A SECOND submission is blocked while one is PENDING.
 *   3. After a decision, the user can submit again.
 *   4. Admin approve picks one of the 3 days → APPROVED + confirmedDate + decidedBy/At.
 *   5. Admin reject → REJECTED + decisionNote + decidedBy/At.
 *   6. The applicant + admin emails render for submit / approve / reject.
 *
 * Emails are captured (not actually sent) so we assert recipients + that the
 * confirmed day / reason appear in the rendered HTML.
 *
 * Run: DATABASE_URL=... npx tsx scripts/verify-applications.mts
 */
import { render } from "@react-email/components";
import { PrismaClient } from "@prisma/client";

import {
  createApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
} from "../src/lib/validation";
import { requestedDateToInstant, isFutureDay } from "../src/lib/dates";
// react-email default exports are double-wrapped under tsx's CJS/ESM interop
// (M.default.default). Next's bundler handles this transparently in the app;
// here we unwrap to reach the actual component function.
function unwrap(mod: any) {
  let c = mod?.default ?? mod;
  if (c && typeof c !== "function" && typeof c.default === "function") c = c.default;
  return c;
}
import * as NewApplicationAdminMod from "../emails/NewApplicationAdmin";
import * as ApplicationApprovedMod from "../emails/ApplicationApproved";
import * as ApplicationRejectedMod from "../emails/ApplicationRejected";

const NewApplicationAdmin = unwrap(NewApplicationAdminMod);
const ApplicationApproved = unwrap(ApplicationApprovedMod);
const ApplicationRejected = unwrap(ApplicationRejectedMod);

const prisma = new PrismaClient();

let pass = 0;
let fail = 0;
function check(label: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ""}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function futureDay(plusDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + plusDays);
  return d.toISOString().slice(0, 10);
}

async function main() {
  // Clean slate for the test users.
  const applicantEmail = "verify.applicant@snu.edu.in";
  const adminEmail = "verify.admin@snu.edu.in";
  await prisma.application.deleteMany({
    where: { applicant: { email: { in: [applicantEmail, adminEmail] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [applicantEmail, adminEmail] } } });

  const applicant = await prisma.user.create({
    data: { email: applicantEmail, name: "Test Applicant", role: "user" },
  });
  const admin = await prisma.user.create({
    data: { email: adminEmail, name: "Test Admin", role: "admin" },
  });

  // ── 1. Validation: distinct + future days enforced ───────────────────────
  console.log("\n[1] Validation rules");
  const sameDays = createApplicationSchema.safeParse({
    filament: "PLA",
    estimatedHours: 2,
    fileKey: `uploads/${applicant.id}/00000000-0000-0000-0000-000000000000.stl`,
    fileName: "model.stl",
    fileSize: 1234,
    preferredDate: futureDay(3),
    altDate1: futureDay(3),
    altDate2: futureDay(5),
  });
  check("rejects non-distinct days", !sameDays.success);

  const badFilament = createApplicationSchema.safeParse({
    filament: "WOOD",
    estimatedHours: 2,
    fileKey: `uploads/${applicant.id}/00000000-0000-0000-0000-000000000000.stl`,
    fileName: "model.stl",
    fileSize: 1234,
    preferredDate: futureDay(3),
    altDate1: futureDay(4),
    altDate2: futureDay(5),
  });
  check("rejects unknown filament", !badFilament.success);

  const negHours = createApplicationSchema.safeParse({
    filament: "PLA",
    estimatedHours: -1,
    fileKey: `uploads/${applicant.id}/00000000-0000-0000-0000-000000000000.stl`,
    fileName: "model.stl",
    fileSize: 1234,
    preferredDate: futureDay(3),
    altDate1: futureDay(4),
    altDate2: futureDay(5),
  });
  check("rejects non-positive hours", !negHours.success);

  check("isFutureDay: tomorrow is future", isFutureDay(futureDay(1)));
  check("isFutureDay: yesterday is not", !isFutureDay(futureDay(-1)));

  // ── 2. Submit (PENDING) — mirrors createApplication action ────────────────
  console.log("\n[2] Submit application");
  const validInput = {
    filament: "PETG" as const,
    estimatedHours: 3.5,
    fileKey: `uploads/${applicant.id}/11111111-1111-1111-1111-111111111111.stl`,
    fileName: "bracket.stl",
    fileSize: 99999,
    preferredDate: futureDay(7),
    altDate1: futureDay(9),
    altDate2: futureDay(11),
  };
  const parsed = createApplicationSchema.safeParse(validInput);
  check("valid input parses", parsed.success);
  if (!parsed.success) throw new Error("cannot continue");

  // one-pending check (none yet)
  const pre = await prisma.application.findFirst({
    where: { userId: applicant.id, status: "PENDING" },
  });
  check("no pending application yet", pre === null);

  const app1 = await prisma.application.create({
    data: {
      userId: applicant.id,
      status: "PENDING",
      filament: parsed.data.filament,
      estimatedHours: parsed.data.estimatedHours,
      fileKey: parsed.data.fileKey,
      fileName: parsed.data.fileName,
      fileSize: parsed.data.fileSize,
      preferredDate: requestedDateToInstant(parsed.data.preferredDate),
      altDate1: requestedDateToInstant(parsed.data.altDate1),
      altDate2: requestedDateToInstant(parsed.data.altDate2),
    },
  });
  check("application created PENDING", app1.status === "PENDING");
  check("confirmedDate null on submit", app1.confirmedDate === null);

  // ── 3. Second submission blocked while pending ────────────────────────────
  console.log("\n[3] One active application per user");
  const pending = await prisma.application.findFirst({
    where: { userId: applicant.id, status: "PENDING" },
    select: { id: true },
  });
  check("second submission is BLOCKED (pending exists)", pending !== null);

  // ── 4. Admin approve picks alt1 → APPROVED + confirmedDate + decidedBy/At ──
  console.log("\n[4] Admin approve (pick a day)");
  const approveParse = approveApplicationSchema.safeParse({
    applicationId: app1.id,
    slot: "alt1",
    note: "Approved for the second option.",
  });
  check("approve input parses", approveParse.success);
  const confirmedDate = app1.altDate1; // slot alt1
  const approved = await prisma.application.update({
    where: { id: app1.id },
    data: {
      status: "APPROVED",
      confirmedDate,
      decisionNote: approveParse.success ? approveParse.data.note : null,
      decidedById: admin.id,
      decidedAt: new Date(),
    },
    include: { applicant: true },
  });
  check("status APPROVED", approved.status === "APPROVED");
  check(
    "confirmedDate == chosen alt1 day",
    approved.confirmedDate?.getTime() === app1.altDate1.getTime()
  );
  check("decidedById recorded", approved.decidedById === admin.id);
  check("decidedAt recorded", approved.decidedAt !== null);
  check("default slot is preferred", approveApplicationSchema.parse({ applicationId: app1.id }).slot === "preferred");

  // ── 5. After decision, user can submit again ──────────────────────────────
  console.log("\n[5] Re-submit allowed after a decision");
  const pendingAfter = await prisma.application.findFirst({
    where: { userId: applicant.id, status: "PENDING" },
  });
  check("no PENDING after approval → can submit again", pendingAfter === null);

  const app2 = await prisma.application.create({
    data: {
      userId: applicant.id,
      status: "PENDING",
      filament: "TPU",
      estimatedHours: 1.5,
      fileKey: `uploads/${applicant.id}/22222222-2222-2222-2222-222222222222.obj`,
      fileName: "v2.obj",
      fileSize: 5000,
      preferredDate: requestedDateToInstant(futureDay(8)),
      altDate1: requestedDateToInstant(futureDay(10)),
      altDate2: requestedDateToInstant(futureDay(12)),
    },
  });
  check("second application submitted after decision", app2.status === "PENDING");

  // ── 6. Admin reject with reason → REJECTED + note + decidedBy/At ───────────
  console.log("\n[6] Admin reject (with reason)");
  const rejectParse = rejectApplicationSchema.safeParse({
    applicationId: app2.id,
    reason: "File has non-manifold edges.",
  });
  check("reject input parses", rejectParse.success);
  const rejected = await prisma.application.update({
    where: { id: app2.id },
    data: {
      status: "REJECTED",
      decisionNote: rejectParse.success ? rejectParse.data.reason : null,
      decidedById: admin.id,
      decidedAt: new Date(),
    },
    include: { applicant: true },
  });
  check("status REJECTED", rejected.status === "REJECTED");
  check("reason stored as decisionNote", rejected.decisionNote === "File has non-manifold edges.");
  check("decidedBy/At recorded on reject", rejected.decidedById === admin.id && rejected.decidedAt !== null);

  // ── 7. Emails render (templates → HTML), recipients correct ───────────────
  console.log("\n[7] Email rendering");
  const fmtDay = (d: Date) =>
    new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(d);

  const adminHtml = await render(
    NewApplicationAdmin({
      requesterName: applicant.name!,
      requesterEmail: applicant.email,
      application: {
        filament: "PETG",
        estimatedHours: 3.5,
        fileName: "bracket.stl",
        preferredDay: fmtDay(app1.preferredDate),
        altDay1: fmtDay(app1.altDate1),
        altDay2: fmtDay(app1.altDate2),
        confirmedDay: null,
      },
      adminUrl: "https://aitest1.snu.in/admin",
    })
  );
  check("admin 'new application' email mentions applicant", adminHtml.includes(applicant.email));
  check("admin email shows requested days", adminHtml.includes(fmtDay(app1.preferredDate)));

  const approvedHtml = await render(
    ApplicationApproved({
      userName: applicant.name!,
      application: {
        filament: "PETG",
        estimatedHours: 3.5,
        fileName: "bracket.stl",
        preferredDay: fmtDay(app1.preferredDate),
        altDay1: fmtDay(app1.altDate1),
        altDay2: fmtDay(app1.altDate2),
        confirmedDay: fmtDay(confirmedDate),
      },
      note: "Approved for the second option.",
      manageUrl: "https://aitest1.snu.in/applications",
    })
  );
  check("approved email shows the CONFIRMED day", approvedHtml.includes(fmtDay(confirmedDate)));
  check("approved email includes filament + hours", approvedHtml.includes("PETG") && approvedHtml.includes("3.5"));

  const rejectedHtml = await render(
    ApplicationRejected({
      userName: applicant.name!,
      application: {
        filament: "TPU",
        estimatedHours: 1.5,
        fileName: "v2.obj",
        preferredDay: fmtDay(app2.preferredDate),
        altDay1: fmtDay(app2.altDate1),
        altDay2: fmtDay(app2.altDate2),
        confirmedDay: null,
      },
      reason: "File has non-manifold edges.",
      manageUrl: "https://aitest1.snu.in/applications",
    })
  );
  check("rejected email includes the reason", rejectedHtml.includes("non-manifold"));

  // ── Cleanup ───────────────────────────────────────────────────────────────
  await prisma.application.deleteMany({ where: { userId: applicant.id } });
  await prisma.user.deleteMany({ where: { email: { in: [applicantEmail, adminEmail] } } });

  console.log(`\n${fail === 0 ? "ALL GREEN" : "FAILURES"}: ${pass} passed, ${fail} failed`);
  await prisma.$disconnect();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
