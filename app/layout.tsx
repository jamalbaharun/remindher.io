import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemindHer.io — The Pulse of Digital Memory",
  description: "Never miss an expiring document. Smart reminders for HR & Admins.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "RemindHer" },
  icons: { apple: "/icons/icon-192x192.png" },
};

export const viewport: Viewport = {
  themeColor: "#af25fe",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-obsidian text-white antialiased">
        {children}
      </body>
    </html>
  );
}
