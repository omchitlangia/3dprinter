import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { ApplicationDetails, type ApplicationInfo } from "./components/ApplicationDetails";
import { Layout, styles } from "./components/Layout";

export interface ApplicationRejectedProps {
  userName: string;
  application: ApplicationInfo;
  reason?: string | null;
  manageUrl: string;
}

export default function ApplicationRejected({
  userName = "there",
  application,
  reason,
  manageUrl = "https://example.com/applications",
}: ApplicationRejectedProps) {
  return (
    <Layout preview="Update on your 3D print application">
      <Text style={styles.heading}>Application not approved</Text>
      <Text style={styles.text}>
        Hi {userName}, unfortunately your print application was not approved this
        time.
      </Text>
      <ApplicationDetails application={application} />
      {reason ? (
        <Text style={styles.text}>
          <strong>Reason:</strong> {reason}
        </Text>
      ) : null}
      <Text style={styles.text}>
        You&apos;re welcome to submit a new application.
      </Text>
      <Section style={{ margin: "8px 0" }}>
        <Button href={manageUrl} style={styles.button}>
          Submit a new application
        </Button>
      </Section>
    </Layout>
  );
}
