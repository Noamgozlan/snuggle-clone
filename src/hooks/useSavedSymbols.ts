import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "saved_trade_symbols";

export const useSavedSymbols = () => {
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSymbols(JSON.parse(stored));
    } catch {}
  }, []);

  const addSymbol = useCallback((symbol: string) => {
    const upper = symbol.trim().toUpperCase();
    if (!upper) return;
    setSymbols((prev) => {
      const filtered = prev.filter((s) => s !== upper);
      const updated = [upper, ...filtered].slice(0, 30); // Keep last 30
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeSymbol = useCallback((symbol: string) => {
    setSymbols((prev) => {
      const updated = prev.filter((s) => s !== symbol);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { symbols, addSymbol, removeSymbol };
};
