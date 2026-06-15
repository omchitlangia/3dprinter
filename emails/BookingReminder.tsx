import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { BookingDetails, type BookingInfo } from "./components/BookingDetails";
import { Layout, styles } from "./components/Layout";

export interface BookingReminderProps {
  userName: string;
  window: "24h" | "1h";
  booking: BookingInfo;
  manageUrl: string;
}

export default function BookingReminder({
  userName = "there",
  window = "24h",
  booking,
  manageUrl = "https://example.com/bookings",
}: BookingReminderProps) {
  const lead = window === "24h" ? "tomorrow" : "in about an hour";
  return (
    <Layout preview={`Reminder: your print slot is ${lead}`}>
      <Text style={styles.heading}>
        Reminder: your print slot is {lead} ⏰
      </Text>
      <Text style={styles.text}>
        Hi {userName}, this is a {window === "24h" ? "24-hour" : "1-hour"}{" "}
        reminder for your upcoming 3D print booking.
      </Text>
      <BookingDetails booking={booking} />
      <Section style={{ margin: "8px 0" }}>
        <Button href={manageUrl} style={styles.button}>
          View booking
        </Button>
      </Section>
    </Layout>
  );
}
