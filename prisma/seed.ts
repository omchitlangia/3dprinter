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

  // Seed a couple of example printers so the scheduling flow works out of the box.
  const printers = [
    {
      name: "Prusa MK4 #1",
      model: "Prusa MK4",
      location: "COE Lab A",
      materials: ["PLA", "PETG", "ABS"],
      colors: ["Black", "White", "Grey", "Red"],
      openMinute: 9 * 60,
      closeMinute: 21 * 60,
    },
    {
      name: "Bambu X1C #1",
      model: "Bambu Lab X1 Carbon",
      location: "COE Lab A",
      materials: ["PLA", "PETG", "ABS", "TPU"],
      colors: ["Black", "White", "Blue", "Orange"],
      openMinute: 9 * 60,
      closeMinute: 21 * 60,
    },
    {
      name: "Ultimaker S5 #1",
      model: "Ultimaker S5",
      location: "COE Lab B",
      materials: ["PLA", "PETG", "Nylon"],
      colors: ["Black", "White", "Natural"],
      openMinute: 10 * 60,
      closeMinute: 18 * 60,
    },
  ];

  for (const p of printers) {
    await prisma.printer.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    console.log(`✓ printer seeded: ${p.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
