"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "dark" | "light";
type Density = "comfortable" | "dense";

type ThemeProviderState = {
  theme: Theme;
  density: Density;
  setTheme: (theme: Theme) => void;
  setDensity: (density: Density) => void;
  toggleTheme: () => void;
  toggleDensity: () => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined
);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [density, setDensityState] = useState<Density>("comfortable");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const storedDensity = localStorage.getItem("density") as Density | null;

    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } else {
       document.documentElement.classList.add("dark");
    }

    if (storedDensity) {
      setDensityState(storedDensity);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem("theme", newTheme);
    setThemeState(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    document.documentElement.style.colorScheme = newTheme;
  };
  
  const setDensity = (newDensity: Density) => {
    localStorage.setItem("density", newDensity);
    setDensityState(newDensity);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleDensity = () => {
    setDensity(density === "comfortable" ? "dense" : "comfortable");
  };

  if (!isMounted) {
    return null;
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, density, setTheme, setDensity, toggleTheme, toggleDensity }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
