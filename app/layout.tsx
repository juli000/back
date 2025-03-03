import { Geist } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "DnD Flips",
  description: "Flip coins and win keys in DnD Flips",
  icons: {
    icon: {
      url: "/favicon.ico",
      type: "image/x-icon",
    },
    shortcut: { url: "/favicon.ico", type: "image/x-icon" },
  },
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geistSans.className}>
      <body className="bg-gray-800 text-white">
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
          {/* Removed header and footer */}
        </div>
        <Analytics />
      </body>
    </html>
  );
}
