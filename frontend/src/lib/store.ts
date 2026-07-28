import { create } from "zustand";

interface UIState {
  /** Mobile nav drawer. Ignored at >=lg where the sidebar is always visible. */
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

/**
 * Small global UI store. Kept deliberately thin — server state lives in React
 * Query, this is only for chrome that two sibling components share.
 */
export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
}));
