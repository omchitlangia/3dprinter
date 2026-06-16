import { Section } from "@react-email/components";
import * as React from "react";

import { styles } from "./Layout";

export interface ApplicationInfo {
  filament: string;
  estimatedHours: number;
  fileName: string;
  preferredDay: string;
  altDay1: string;
  altDay2: string;
  confirmedDay?: string | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <p style={styles.label}>{label}</p>
      <p style={styles.value}>{value}</p>
    </div>
  );
}

export function ApplicationDetails({
  application,
}: {
  application: ApplicationInfo;
}) {
  return (
    <Section
      style={{
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 16px",
      }}
    >
      <Row label="Filament" value={application.filament} />
      <Row label="Estimated hours" value={`${application.estimatedHours} h`} />
      <Row label="File" value={application.fileName} />
      {application.confirmedDay ? (
        <Row label="Confirmed day" value={application.confirmedDay} />
      ) : (
        <Row
          label="Requested days"
          value={
            <>
              {application.preferredDay} (preferred)
              <br />
              {application.altDay1}
              <br />
              {application.altDay2}
            </>
          }
        />
      )}
    </Section>
  );
}
