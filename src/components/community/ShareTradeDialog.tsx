import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  strategy: string | null;
  screenshot_url: string | null;
  entry_date: string | null;
  is_closed: boolean;
}

interface ShareTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTrade: (trade: Trade) => void;
}

export const ShareTradeDialog = ({
  open,
  onOpenChange,
  onSelectTrade,
}: ShareTradeDialogProps) => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTrades = async () => {
      if (!user || !open) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("trades")
          .select("id, symbol, trade_type, entry_price, exit_price, pnl, strategy, screenshot_url, entry_date, is_closed")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setTrades(data || []);
      } catch (error) {
        console.error("Error fetching trades:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, [user, open]);

  const filteredTrades = trades.filter((trade) =>
    trade.symbol.toLowerCase().includes(search.toLowerCase()) ||
    trade.strategy?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  const handleSelect = (trade: Trade) => {
    onSelectTrade(trade);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>שתף עסקה מהיומן</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש לפי סימול או אסטרטגיה..."
              className="pr-10"
            />
          </div>

          {/* Trades List */}
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? "לא נמצאו עסקאות תואמות" : "אין עסקאות ביומן"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTrades.map((trade) => (
                  <button
                    key={trade.id}
                    onClick={() => handleSelect(trade)}
                    className="w-full p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-right"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={trade.trade_type === "long" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {trade.trade_type === "long" ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {trade.trade_type.toUpperCase()}
                        </Badge>
                        <span className="font-semibold">{trade.symbol}</span>
                      </div>
                      {trade.pnl !== null && (
                        <span
                          className={cn(
                            "font-bold text-sm",
                            trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {trade.strategy && (
                          <Badge variant="outline" className="text-xs">
                            {trade.strategy}
                          </Badge>
                        )}
                        {!trade.is_closed && (
                          <Badge variant="secondary" className="text-xs">
                            פתוחה
                          </Badge>
                        )}
                      </div>
                      <span>{formatDate(trade.entry_date)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
