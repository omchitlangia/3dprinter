import { Button, Section, Text } from "@react-email/components";
import * as React from "react";

import { ApplicationDetails, type ApplicationInfo } from "./components/ApplicationDetails";
import { Layout, styles } from "./components/Layout";

export interface NewApplicationAdminProps {
  requesterName: string;
  requesterEmail: string;
  application: ApplicationInfo;
  adminUrl: string;
  // When true, this is the record copy sent to admins AFTER an approval.
  approvedCopy?: boolean;
}

export default function NewApplicationAdmin({
  requesterName = "A user",
  requesterEmail = "user@example.com",
  application,
  adminUrl = "https://example.com/admin",
  approvedCopy = false,
}: NewApplicationAdminProps) {
  const preview = approvedCopy
    ? "Print application approved (record copy)"
    : "New 3D print application to review";
  return (
    <Layout preview={preview}>
      <Text style={styles.heading}>
        {approvedCopy ? "Application approved" : "New application to review"}
      </Text>
      <Text style={styles.text}>
        {requesterName} ({requesterEmail}){" "}
        {approvedCopy
          ? "has had their print application approved."
          : "submitted a print application for review."}
      </Text>
      <ApplicationDetails application={application} />
      <Section style={{ margin: "8px 0" }}>
        <Button href={adminUrl} style={styles.button}>
          Open review dashboard
        </Button>
      </Section>
    </Layout>
  );
}
