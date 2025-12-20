import type { Metadata } from "next";
import "./globals.css";



export const metadata: Metadata = {
  title: "Leaf Disease Detection",
  description: "Detect plant diseases instantly with our advanced AI technology. Upload a leaf image and get comprehensive analysis with treatment recommendations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
