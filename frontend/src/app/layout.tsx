import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Sales App",
  description: "Simple sales management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
