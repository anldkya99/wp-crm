import type { Metadata } from "next";
import { getServerLocale } from "@/lib/platform/localization/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhatsApp Operasyon Paneli",
  description: "Tek numaralı WhatsApp operasyon paneli V2"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
