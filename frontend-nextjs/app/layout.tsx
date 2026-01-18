import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Leaf Disease Detection | AI-Powered Plant Health Analysis",
  description: "Advanced AI-powered leaf disease detection and analysis system. Upload images, get instant diagnoses, and protect your crops with cutting-edge machine learning technology.",
  keywords: ["leaf disease", "plant health", "AI detection", "crop protection", "agriculture technology"],
  authors: [{ name: "Leaf Disease Detection Team" }],
  openGraph: {
    title: "Leaf Disease Detection",
    description: "AI-powered leaf disease detection and analysis",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
