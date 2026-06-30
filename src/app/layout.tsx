import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import CartDrawer from "@/components/CartDrawer";

const jost = Jost({
  variable: '--font-jost',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: "Nike",
  description: "Explore the exclusive collection of high-performance Nike running, lifestyle, and basketball footwear at Nike Select Lab. Built with Next.js, Drizzle, and Zustand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jost.className} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 transition-colors duration-300">
        <Navigation />
        <main className="flex-1 flex flex-col">{children}</main>
        <CartDrawer />
        
        {/* Premium Footer */}
        <footer className="border-t border-neutral-200/50 bg-white py-12 dark:border-neutral-800/50 dark:bg-neutral-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <p className="text-xs text-neutral-500">
                &copy; {new Date().getFullYear()} Nike Select Lab. All rights reserved. Built with Drizzle ORM, Better Auth & Zustand.
              </p>
              <div className="flex space-x-6 text-xs text-neutral-500">
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
