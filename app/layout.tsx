import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SiteBanner from "./components/SiteBanner";
import SiteLoading from "./components/SiteLoading";
import WorldTools from "./components/WorldTools";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Planet Urf",
  description: "Choose a path between reality and the unknown.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SiteLoading />
        <SiteBanner />
        <WorldTools>{children}</WorldTools>
      </body>
    </html>
  );
}
