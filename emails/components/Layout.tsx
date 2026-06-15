import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const main: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: "24px 0",
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "32px",
};

const brand: React.CSSProperties = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
};

const sub: React.CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  margin: "2px 0 0",
};

const footer: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "11px",
  marginTop: "8px",
};

export function Layout({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <Text style={brand}>COE 3D Print Lab</Text>
            <Text style={sub}>AI Center of Excellence · Shiv Nadar University</Text>
          </Section>
          <Hr style={{ borderColor: "#e2e8f0", margin: "20px 0" }} />
          {children}
          <Hr style={{ borderColor: "#e2e8f0", margin: "20px 0" }} />
          <Text style={footer}>
            This is an automated message from the COE 3D Print booking system.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  heading: {
    color: "#0f172a",
    fontSize: "20px",
    fontWeight: 700,
    margin: "0 0 12px",
  } as React.CSSProperties,
  text: {
    color: "#334155",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0 0 12px",
  } as React.CSSProperties,
  label: {
    color: "#64748b",
    fontSize: "12px",
    margin: "0",
  } as React.CSSProperties,
  value: {
    color: "#0f172a",
    fontSize: "14px",
    fontWeight: 600,
    margin: "0 0 8px",
  } as React.CSSProperties,
  button: {
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 20px",
    textDecoration: "none",
  } as React.CSSProperties,
};
