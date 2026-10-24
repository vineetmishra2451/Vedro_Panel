import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Vedro Business Dashboard",
  description: "Executive control center for Vedro food products partnership",
  icons: {
    icon: [
      { url: "/mobilevedrologo.png" },
      { url: "/icon.png" },
    ],
    shortcut: "/mobilevedrologo.png",
    apple: "/mobilevedrologo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#FCFAF3] text-[#29271F]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
