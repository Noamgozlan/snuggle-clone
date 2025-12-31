import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Gif {
  id: string;
  title: string;
  preview: string;
  url: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  disabled?: boolean;
}

export const GifPicker = ({ onSelect, disabled }: GifPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchGifs = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("search-gifs", {
        body: { query: searchQuery, limit: 24 },
      });

      if (fnError) throw fnError;
      
      setGifs(data?.gifs || []);
    } catch (err) {
      console.error("Error fetching GIFs:", err);
      setError("שגיאה בטעינת GIFs");
      setGifs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load trending GIFs when opened
  useEffect(() => {
    if (open && gifs.length === 0) {
      searchGifs("");
    }
  }, [open, gifs.length, searchGifs]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      searchGifs(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open, searchGifs]);

  const handleSelect = (gif: Gif) => {
    onSelect(gif.url);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={disabled}
          title="שלח GIF"
        >
          <span className="text-sm font-bold">GIF</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        side="top"
      >
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חפש GIFs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-9 pl-8"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setQuery("")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-64">
          {loading ? (
            <div className="flex items-center justify-center h-full py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full py-8 text-muted-foreground text-sm">
              {error}
            </div>
          ) : gifs.length === 0 ? (
            <div className="flex items-center justify-center h-full py-8 text-muted-foreground text-sm">
              לא נמצאו GIFs
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1 p-2">
              {gifs.map((gif) => (
                <button
                  key={gif.id}
                  onClick={() => handleSelect(gif)}
                  className={cn(
                    "relative overflow-hidden rounded-md bg-muted",
                    "hover:ring-2 hover:ring-primary transition-all",
                    "focus:outline-none focus:ring-2 focus:ring-primary"
                  )}
                  style={{ aspectRatio: `${gif.width}/${gif.height}` }}
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border text-center">
          <span className="text-xs text-muted-foreground">
            Powered by Tenor
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};
