import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";
type ColorScheme = "emerald" | "blue" | "purple" | "orange" | "rose" | "cyan";
type VisualStyle = "classic" | "macos" | "minimal" | "neon";

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  visualStyle: VisualStyle;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  setVisualStyle: (style: VisualStyle) => void;
}

export const colorSchemeOptions: { value: ColorScheme; label: string; primary: string; gradient: string }[] = [
  { value: "emerald", label: "אמרלד", primary: "hsl(160, 84%, 45%)", gradient: "from-emerald-500 to-emerald-600" },
  { value: "blue", label: "כחול", primary: "hsl(217, 91%, 60%)", gradient: "from-blue-500 to-blue-600" },
  { value: "purple", label: "סגול", primary: "hsl(262, 83%, 58%)", gradient: "from-purple-500 to-purple-600" },
  { value: "orange", label: "כתום", primary: "hsl(25, 95%, 53%)", gradient: "from-orange-500 to-orange-600" },
  { value: "rose", label: "ורוד", primary: "hsl(350, 89%, 60%)", gradient: "from-rose-500 to-rose-600" },
  { value: "cyan", label: "טורקיז", primary: "hsl(189, 94%, 43%)", gradient: "from-cyan-500 to-cyan-600" },
];

export const visualStyleOptions: { value: VisualStyle; label: string; description: string; icon: string }[] = [
  { value: "classic", label: "קלאסי", description: "המראה הסטנדרטי והמוכר", icon: "layout" },
  { value: "macos", label: "macOS", description: "נקי ומלוטש בסגנון אפל", icon: "monitor" },
  { value: "minimal", label: "מינימליסטי", description: "פשוט, נקי וללא הסחות", icon: "minus-square" },
  { value: "neon", label: "זוהר", description: "דינמי עם אפקטי glow", icon: "zap" },
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

  const [visualStyle, setVisualStyleState] = useState<VisualStyle>(() => {
    const saved = localStorage.getItem("visualStyle");
    // Migrate old "glass" value to "macos"
    if (saved === "glass") return "macos";
    return (saved as VisualStyle) || "classic";
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

  useEffect(() => {
    const root = document.documentElement;
    // Remove all visual style classes
    visualStyleOptions.forEach(opt => {
      root.classList.remove(`style-${opt.value}`);
    });
    // Add current visual style
    root.classList.add(`style-${visualStyle}`);
    localStorage.setItem("visualStyle", visualStyle);
  }, [visualStyle]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  const setVisualStyle = (style: VisualStyle) => {
    setVisualStyleState(style);
  };

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, visualStyle, toggleTheme, setColorScheme, setVisualStyle }}>
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
