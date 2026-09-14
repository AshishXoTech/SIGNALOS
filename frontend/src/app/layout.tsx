import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: {
    default: "Signal OS — National Emergency Coordination Platform | Government of India",
    template: "%s | Signal OS — MHA / ERSS 112",
  },
  description:
    "Signal OS is India's AI-driven national emergency coordination platform for first responders, dispatch, and multi-agency crisis operations under the Emergency Response Support System (ERSS 112).",
  applicationName: "Signal OS",
  authors: [{ name: "Ministry of Home Affairs / Signal OS" }],
  keywords: [
    "Signal OS",
    "ERSS 112",
    "Emergency Response",
    "National Disaster Management",
    "First Responders India",
    "MHA",
    "Government of India",
  ],
  icons: {
    icon: "/signal-os-logo.svg",
    shortcut: "/signal-os-logo.svg",
    apple: "/signal-os-logo.svg",
  },
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