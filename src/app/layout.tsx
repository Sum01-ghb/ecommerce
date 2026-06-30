import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nike",
  description:
    "Explore the exclusive collection of high-performance Nike running, lifestyle, and basketball footwear at Nike Select Lab. Built with Next.js, Drizzle, and Zustand.",
};

/**
 * Root HTML shell — no Navbar/Footer here.
 * Each route group ((root), (auth)) provides its own layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jost.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-light-200 text-dark-900">
        {children}
      </body>
    </html>
  );
}
