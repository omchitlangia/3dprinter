import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { BookingDetails, type BookingInfo } from "./components/BookingDetails";
import { Layout, styles } from "./components/Layout";

export interface BookingConfirmedProps {
  userName: string;
  booking: BookingInfo;
  manageUrl: string;
}

export default function BookingConfirmed({
  userName = "there",
  booking,
  manageUrl = "https://example.com/bookings",
}: BookingConfirmedProps) {
  return (
    <Layout preview="Your 3D print booking is confirmed">
      <Text style={styles.heading}>Booking confirmed ✅</Text>
      <Text style={styles.text}>
        Hi {userName}, your print slot is confirmed. Please drop off / be ready
        per lab policy at your scheduled time.
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
