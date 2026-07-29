"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Density = "comfortable" | "compact";
export type ThemeMode = "light" | "system";
interface PreferencesContextValue {
  density: Density;
  setDensity: (density: Density) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
  dealValue: number;
  setDealValue: (value: number) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>("comfortable");
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [dealValue, setDealValueState] = useState(75_000);

  useEffect(() => {
    setDensityState((localStorage.getItem("ailh:density") as Density) || "comfortable");
    setThemeState((localStorage.getItem("ailh:theme") as ThemeMode) || "light");
    setReducedMotionState(localStorage.getItem("ailh:reduced-motion") === "true");
    setDealValueState(Number(localStorage.getItem("ailh:deal-value")) || 75_000);
  }, []);

  const setDensity = (value: Density) => { setDensityState(value); localStorage.setItem("ailh:density", value); };
  const setTheme = (value: ThemeMode) => { setThemeState(value); localStorage.setItem("ailh:theme", value); };
  const setReducedMotion = (value: boolean) => { setReducedMotionState(value); localStorage.setItem("ailh:reduced-motion", String(value)); };
  const setDealValue = (value: number) => { setDealValueState(value); localStorage.setItem("ailh:deal-value", String(value)); };

  useEffect(() => {
    document.documentElement.dataset.density = density;
    document.documentElement.dataset.reduceMotion = String(reducedMotion);
  }, [density, reducedMotion]);

  const value = useMemo(() => ({ density, setDensity, theme, setTheme, reducedMotion, setReducedMotion, dealValue, setDealValue }), [density, theme, reducedMotion, dealValue]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesProvider");
  return value;
}
