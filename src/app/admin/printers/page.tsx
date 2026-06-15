import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { PrinterControls } from "./printer-controls";

export default async function AdminPrintersPage() {
  const printers = await prisma.printer.findMany({
    orderBy: { name: "asc" },
    include: {
      maintenanceWindows: {
        where: { end: { gt: new Date() } },
        orderBy: { start: "asc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Printers &amp; maintenance</h1>
        <Link href="/admin" className="text-sm underline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {printers.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{p.name}</CardTitle>
                <Badge
                  variant={
                    p.status === "available"
                      ? "success"
                      : p.status === "maintenance"
                        ? "warning"
                        : "muted"
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {p.model ?? "—"} · {p.location ?? "—"} ·{" "}
                {p.materials.join(", ") || "no materials"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <PrinterControls printerId={p.id} status={p.status} />

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Upcoming maintenance
                </p>
                {p.maintenanceWindows.length === 0 ? (
                  <p className="text-xs text-muted-foreground">None scheduled.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {p.maintenanceWindows.map((m) => (
                      <li key={m.id} className="text-muted-foreground">
                        {formatDateTime(m.start)} → {formatDateTime(m.end)}
                        {m.reason ? ` · ${m.reason}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
