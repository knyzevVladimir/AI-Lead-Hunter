import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "AI Lead Hunter",
  description:
    "AI-платформа для поиска локального бизнеса, анализа цифрового присутствия и автоматизации клиентского охвата.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <Sidebar />
          <main className="ml-64 min-h-screen">
            <div className="mx-auto max-w-[1400px] px-8 py-8">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
