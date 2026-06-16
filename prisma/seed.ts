import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

async function main() {
  // Seed admin users from env. Existing users get upgraded to admin; missing
  // ones are created (they'll attach an OAuth/email account on first sign-in).
  for (const email of adminEmails) {
    await prisma.user.upsert({
      where: { email },
      update: { role: Role.admin },
      create: { email, role: Role.admin, name: email.split("@")[0] },
    });
    console.log(`✓ admin seeded: ${email}`);
  }

  // No printers/scheduling data to seed — the application-review model has no
  // printer inventory. Admins above are the only seed data.
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
