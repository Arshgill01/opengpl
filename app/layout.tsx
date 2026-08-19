import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenGPL Price Evidence Desk",
  description: "Consent-first funeral price survey review with CALL-E."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
