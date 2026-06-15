import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { BookingDetails, type BookingInfo } from "./components/BookingDetails";
import { Layout, styles } from "./components/Layout";

export interface NewBookingAdminProps {
  requesterName: string;
  requesterEmail: string;
  booking: BookingInfo;
  adminUrl: string;
}

export default function NewBookingAdmin({
  requesterName = "A user",
  requesterEmail = "user@example.com",
  booking,
  adminUrl = "https://example.com/admin",
}: NewBookingAdminProps) {
  return (
    <Layout preview="New 3D print booking submitted">
      <Text style={styles.heading}>New booking submitted</Text>
      <Text style={styles.text}>
        {requesterName} ({requesterEmail}) just booked a print slot.
      </Text>
      <BookingDetails booking={booking} />
      <Section style={{ margin: "8px 0" }}>
        <Button href={adminUrl} style={styles.button}>
          Open admin dashboard
        </Button>
      </Section>
    </Layout>
  );
}
