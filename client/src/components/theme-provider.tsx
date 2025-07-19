// src/components/theme-provider.tsx

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    console.log("ThemeProvider useEffect: Running for theme:", theme); // <--- ADD THIS LOG

    const root = window.document.documentElement; // This refers to the <html> tag

    root.classList.remove("light", "dark"); // Ensure old classes are removed

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      console.log("ThemeProvider useEffect: Applied system theme:", systemTheme); // <--- ADD THIS LOG
    } else {
      root.classList.add(theme); // Add 'dark' or 'light' class
      console.log("ThemeProvider useEffect: Applied theme class:", theme); // <--- ADD THIS LOG
    }
  }, [theme]); // Dependency array: this effect re-runs when the 'theme' state changes

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      console.log("ThemeProvider: Attempting to set theme to:", newTheme);
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme); // This is the state updater from React's useState hook
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook to easily use the theme context in any component
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};