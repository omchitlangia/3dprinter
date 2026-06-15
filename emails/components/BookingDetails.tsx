import { Section } from "@react-email/components";
import * as React from "react";

import { styles } from "./Layout";

export interface BookingInfo {
  printerName: string;
  startLabel: string;
  durationMinutes: number;
  material: string;
  color: string;
  fileName: string;
  notes?: string | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value}</p>
    </div>
  );
}

export function BookingDetails({ booking }: { booking: BookingInfo }) {
  return (
    <Section
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 16px",
      }}
    >
      <Row label="Printer" value={booking.printerName} />
      <Row label="Start" value={booking.startLabel} />
      <Row
        label="Estimated duration"
        value={`${Math.floor(booking.durationMinutes / 60)}h ${
          booking.durationMinutes % 60
        }m`}
      />
      <Row label="Material / Color" value={`${booking.material} · ${booking.color}`} />
      <Row label="File" value={booking.fileName} />
      {booking.notes ? <Row label="Notes" value={booking.notes} /> : null}
    </Section>
  );
}
