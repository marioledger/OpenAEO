import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenAEO",
  description: "AI answer-engine readiness and open-web attribution audits."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
