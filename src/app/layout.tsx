import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { isDemoMode } from "@/lib/auth/demo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateMetadata(): Metadata {
  const inDemo = isDemoMode();

  return {
    title: inDemo ? "Hiring Radar (Public Demo)" : "Hiring Radar",
    description: "Curated AI and backend hiring lead discovery system",
    robots: inDemo
      ? {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
      }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
