import { Button, Link, Section, Text } from "@react-email/components";
import * as React from "react";

import { Layout, styles } from "./components/Layout";

export interface MagicLinkProps {
  url: string;
  host: string;
}

export default function MagicLink({
  url = "https://example.com",
  host = "example.com",
}: MagicLinkProps) {
  return (
    <Layout preview={`Sign in to COE 3D Print (${host})`}>
      <Text style={styles.heading}>Sign in to COE 3D Print</Text>
      <Text style={styles.text}>
        Click the button below to sign in to your COE 3D Print Lab account. This
        link is valid for a limited time and can be used once.
      </Text>
      <Section style={{ margin: "20px 0" }}>
        <Button href={url} style={styles.button}>
          Sign in
        </Button>
      </Section>
      <Text style={styles.text}>
        Or paste this URL into your browser:
        <br />
        <Link href={url} style={{ color: "#2563eb", fontSize: "12px" }}>
          {url}
        </Link>
      </Text>
      <Text style={{ ...styles.text, color: "#94a3b8", fontSize: "12px" }}>
        If you didn&apos;t request this email, you can safely ignore it.
      </Text>
    </Layout>
  );
}
