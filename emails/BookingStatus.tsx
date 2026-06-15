import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { BookingDetails, type BookingInfo } from "./components/BookingDetails";
import { Layout, styles } from "./components/Layout";

export type StatusKind = "printing" | "ready_for_pickup" | "cancelled" | "rejected";

const COPY: Record<StatusKind, { heading: string; body: string }> = {
  printing: {
    heading: "Your print has started 🖨️",
    body: "Your model is now printing. We'll let you know when it's ready for pickup.",
  },
  ready_for_pickup: {
    heading: "Ready for pickup 📦",
    body: "Your print is complete and ready for pickup at the COE 3D Print Lab.",
  },
  cancelled: {
    heading: "Booking cancelled",
    body: "Your 3D print booking has been cancelled. If this was unexpected, please contact the lab.",
  },
  rejected: {
    heading: "Booking rejected",
    body: "Unfortunately your 3D print booking was rejected. Please contact the lab for details.",
  },
};

export interface BookingStatusProps {
  userName: string;
  kind: StatusKind;
  booking: BookingInfo;
  manageUrl: string;
  reason?: string | null;
}

export default function BookingStatus({
  userName = "there",
  kind = "printing",
  booking,
  manageUrl = "https://example.com/bookings",
  reason,
}: BookingStatusProps) {
  const copy = COPY[kind];
  return (
    <Layout preview={copy.heading}>
      <Text style={styles.heading}>{copy.heading}</Text>
      <Text style={styles.text}>Hi {userName}, {copy.body}</Text>
      {reason ? (
        <Text style={{ ...styles.text, color: "#64748b" }}>Reason: {reason}</Text>
      ) : null}
      <BookingDetails booking={booking} />
      <Section style={{ margin: "8px 0" }}>
        <Button href={manageUrl} style={styles.button}>
          View booking
        </Button>
      </Section>
    </Layout>
  );
}
