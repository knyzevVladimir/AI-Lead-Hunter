"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "@/providers/query-provider";
import { PreferencesProvider } from "@/providers/preferences-provider";
import { ShellProvider } from "@/providers/shell-provider";
import { ToastProvider } from "@/providers/toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <PreferencesProvider>
        <ShellProvider>
          <ToastProvider>{children}</ToastProvider>
        </ShellProvider>
      </PreferencesProvider>
    </QueryProvider>
  );
}
