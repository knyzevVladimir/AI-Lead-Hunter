import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import Aurora from "@/components/visuals/Aurora";
import PageTransition from "@/components/motion/PageTransition";

// Self-hosted by Next at build time: no runtime request to Google, no FOUT.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AI Lead Hunter",
    template: "%s · AI Lead Hunter",
  },
  description:
    "AI-платформа для поиска локального бизнеса, анализа цифрового присутствия и автоматизации клиентского охвата.",
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="font-sans antialiased">
        {/* Reveal animations start at opacity:0. If JS never runs, show
            everything rather than leaving a blank page. */}
        <noscript>
          <style>{`.motion-reveal{opacity:1!important;transform:none!important;filter:none!important}`}</style>
        </noscript>

        <Aurora />

        <Providers>
          <Sidebar />
          <div className="lg:pl-64">
            <Topbar />
            <main className="min-h-screen">
              <div className="mx-auto max-w-[1400px] px-5 py-6 sm:px-8 sm:py-8">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
