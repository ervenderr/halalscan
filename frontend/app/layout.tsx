import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import ThemeInit from "@/components/ThemeInit";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HalalChecker AI",
  description: "AI-powered halal ingredient scanner",
  manifest: "/manifest.json",
  icons: {
    icon: "/halalchecker-log.png",
    apple: "/halalchecker-log.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HalalChecker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <ThemeInit />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
