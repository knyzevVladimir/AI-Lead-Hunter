"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface ShellContextValue {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (value: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (value: boolean) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    setSidebarCollapsedState(localStorage.getItem("ailh:sidebar-collapsed") === "true");
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const setSidebarCollapsed = (value: boolean) => {
    setSidebarCollapsedState(value);
    localStorage.setItem("ailh:sidebar-collapsed", String(value));
  };

  const value = useMemo(() => ({ sidebarCollapsed, setSidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen, commandOpen, setCommandOpen }), [sidebarCollapsed, mobileSidebarOpen, commandOpen]);
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside ShellProvider");
  return value;
}
