import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type FontFamily = "heebo" | "rubik" | "assistant" | "alef" | "varela-round";

interface FontOption {
  value: FontFamily;
  label: string;
  className: string;
}

export const fontOptions: FontOption[] = [
  { value: "heebo", label: "Heebo", className: "font-heebo" },
  { value: "rubik", label: "Rubik", className: "font-rubik" },
  { value: "assistant", label: "Assistant", className: "font-assistant" },
  { value: "alef", label: "Alef", className: "font-alef" },
  { value: "varela-round", label: "Varela Round", className: "font-varela" },
];

interface FontContextType {
  font: FontFamily;
  setFont: (font: FontFamily) => void;
  fontClass: string;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

const FONT_STORAGE_KEY = "gozlan-font";

export const FontProvider = ({ children }: { children: ReactNode }) => {
  const [font, setFontState] = useState<FontFamily>(() => {
    const stored = localStorage.getItem(FONT_STORAGE_KEY);
    return (stored as FontFamily) || "heebo";
  });

  const setFont = (newFont: FontFamily) => {
    setFontState(newFont);
    localStorage.setItem(FONT_STORAGE_KEY, newFont);
  };

  const fontClass = fontOptions.find((f) => f.value === font)?.className || "font-heebo";

  useEffect(() => {
    // Update body class when font changes
    const body = document.body;
    fontOptions.forEach((f) => body.classList.remove(f.className));
    body.classList.add(fontClass);
  }, [fontClass]);

  return (
    <FontContext.Provider value={{ font, setFont, fontClass }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
