import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Signal OS — Emergency Coordination",
  description: "Citizen-to-response coordination platform",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B1120",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-navy-900">
        <OfflineIndicator />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1A2332",
              color: "#F1F5F9",
              border: "1px solid #1E3A5F",
              fontSize: "13px",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}