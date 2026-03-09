import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SymbolComboboxProps {
  value: string;
  onChange: (value: string) => void;
  savedSymbols: string[];
  onRemoveSymbol?: (symbol: string) => void;
  className?: string;
}

export const SymbolCombobox = ({ value, onChange, savedSymbols, onRemoveSymbol, className }: SymbolComboboxProps) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value
    ? savedSymbols.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s !== value.toUpperCase())
    : savedSymbols;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="NQ, ES..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={cn("bg-input border-border hover:border-primary/50 transition-colors", className)}
          required
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full max-h-40 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            {filtered.map((symbol) => (
              <div
                key={symbol}
                className="flex items-center justify-between px-3 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(symbol);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{symbol}</span>
                {onRemoveSymbol && (
                  <button
                    type="button"
                    className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveSymbol(symbol);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Quick-select badges */}
      {savedSymbols.length > 0 && !open && (
        <div className="flex flex-wrap gap-1">
          {savedSymbols.slice(0, 6).map((symbol) => (
            <Badge
              key={symbol}
              variant="outline"
              className="cursor-pointer text-xs px-2 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onChange(symbol)}
            >
              {symbol}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
