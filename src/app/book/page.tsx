import { prisma } from "@/lib/prisma";
import { requireUserPage } from "@/server/auth/guards";
import { BookingWizard } from "./booking-wizard";

export default async function BookPage() {
  await requireUserPage();

  // Surface the distinct materials/colors across available printers so the
  // submit form can offer sensible choices.
  const printers = await prisma.printer.findMany({
    where: { status: "available" },
    select: { materials: true, colors: true },
  });
  const materials = [...new Set(printers.flatMap((p) => p.materials))].sort();
  const colors = [...new Set(printers.flatMap((p) => p.colors))].sort();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New booking</h1>
        <p className="text-muted-foreground">
          Submit your model, then pick a slot on a compatible printer.
        </p>
      </div>
      <BookingWizard materials={materials} colors={colors} />
    </div>
  );
}
