import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
type ColorScheme = "emerald" | "blue" | "purple" | "orange" | "rose" | "cyan";

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const colorSchemeOptions: { value: ColorScheme; label: string; primary: string; gradient: string }[] = [
  { value: "emerald", label: "אמרלד", primary: "hsl(160, 84%, 45%)", gradient: "from-emerald-500 to-emerald-600" },
  { value: "blue", label: "כחול", primary: "hsl(217, 91%, 60%)", gradient: "from-blue-500 to-blue-600" },
  { value: "purple", label: "סגול", primary: "hsl(262, 83%, 58%)", gradient: "from-purple-500 to-purple-600" },
  { value: "orange", label: "כתום", primary: "hsl(25, 95%, 53%)", gradient: "from-orange-500 to-orange-600" },
  { value: "rose", label: "ורוד", primary: "hsl(350, 89%, 60%)", gradient: "from-rose-500 to-rose-600" },
  { value: "cyan", label: "טורקיז", primary: "hsl(189, 94%, 43%)", gradient: "from-cyan-500 to-cyan-600" },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "dark";
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem("colorScheme");
    return (saved as ColorScheme) || "emerald";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all color scheme classes
    colorSchemeOptions.forEach(opt => {
      root.classList.remove(`scheme-${opt.value}`);
    });
    // Add current color scheme
    root.classList.add(`scheme-${colorScheme}`);
    localStorage.setItem("colorScheme", colorScheme);
  }, [colorScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
