import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"] });

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.inMemoryOf,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>{children}</body>
    </html>
  );
}
