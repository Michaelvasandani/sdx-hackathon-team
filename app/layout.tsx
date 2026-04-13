import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Truth Seeker",
  description: "AI Market Integrity Agent for Forum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
