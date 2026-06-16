import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { ApplicationDetails, type ApplicationInfo } from "./components/ApplicationDetails";
import { Layout, styles } from "./components/Layout";

export interface ApplicationApprovedProps {
  userName: string;
  application: ApplicationInfo;
  note?: string | null;
  manageUrl: string;
}

export default function ApplicationApproved({
  userName = "there",
  application,
  note,
  manageUrl = "https://example.com/applications",
}: ApplicationApprovedProps) {
  return (
    <Layout preview="Your 3D print application was approved">
      <Text style={styles.heading}>Application approved ✅</Text>
      <Text style={styles.text}>
        Hi {userName}, your print application has been approved. Your print is
        confirmed for <strong>{application.confirmedDay}</strong>. Please follow
        lab policy for drop-off / collection.
      </Text>
      <ApplicationDetails application={application} />
      {note ? (
        <Text style={styles.text}>
          <strong>Note from the lab:</strong> {note}
        </Text>
      ) : null}
      <Section style={{ margin: "8px 0" }}>
        <Button href={manageUrl} style={styles.button}>
          View my applications
        </Button>
      </Section>
    </Layout>
  );
}
