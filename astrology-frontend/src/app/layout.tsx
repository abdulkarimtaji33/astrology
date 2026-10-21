import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AppNav from "@/components/AppNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jyotish · Vedic Birth Chart",
  description: "Vedic astrology birth chart, transits, numerology and AI-powered analysis",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
    { media: "(prefers-color-scheme: light)", color: "#f6f3fb" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} min-h-dvh antialiased flex flex-col`}
      >
        <Providers>
          <div className="starfield" aria-hidden />
          <Link href="#main-content" className="skip-link">
            Skip to content
          </Link>
          <AppNav />
          <main
            id="main-content"
            tabIndex={-1}
            className="app-main flex flex-1 flex-col outline-none"
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
