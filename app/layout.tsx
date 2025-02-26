
import { Geist } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-800 text-white">
        <div className="flex flex-col min-h-screen">
          <main className="flex-1">{children}</main>
          {/* Removed header and footer */}
        </div>
      </body>
    </html>
  );
}
