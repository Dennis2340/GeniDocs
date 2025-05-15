import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navigation from "@/components/Navigation";

// Load Inter font with subsets
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Doc Builder",
  description: "AI-powered documentation generator for your codebase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-gray-50 min-h-screen">
        <Providers>
          <Navigation />
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
