import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/providers/convex-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quran LMS - Student Progress Dashboard",
  description: "Track student Quran memorization progress at Al-Hikmah Learning Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Uthmani Quran fonts for authentic Mushaf look */}
        <link
          href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&family=Amiri+Quran&family=Amiri:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* KFGQPC Uthmanic Script - used by many Mushaf apps */}
        <link
          href="https://cdn.jsdelivr.net/npm/@quranfonts/kfgqpc-uthmanic-script-hafs@1.0.0/font.css"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
