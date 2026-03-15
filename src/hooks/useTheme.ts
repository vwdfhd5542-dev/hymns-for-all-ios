import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "dark";
  });

  const [glassEnabled, setGlassEnabled] = useState(() => {
    return localStorage.getItem("glass-enabled") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "glass-theme");
    root.classList.add(mode);
    if (glassEnabled) root.classList.add("glass-theme");
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("glass-enabled", String(glassEnabled));
    
    // Update theme-color meta
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", mode === "dark" ? "#000000" : "#ffffff");
  }, [mode, glassEnabled]);

  const toggleMode = useCallback(() => {
    setMode(m => m === "dark" ? "light" : "dark");
  }, []);

  const toggleGlass = useCallback(() => {
    setGlassEnabled(g => !g);
  }, []);

  return { mode, glassEnabled, toggleMode, toggleGlass, setMode };
}
