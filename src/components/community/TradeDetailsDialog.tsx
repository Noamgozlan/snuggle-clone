import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar, DollarSign, Target, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ImageViewer } from "@/components/ui/image-viewer";

interface Trade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price?: number | null;
  pnl?: number | null;
  strategy?: string | null;
  entry_date?: string | null;
  exit_date?: string | null;
  quantity?: number;
  notes?: string | null;
  screenshot_url?: string | null;
  rr?: number | null;
  commission?: number | null;
}


interface TradeDetailsDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TradeDetailsDialog = ({ trade, open, onOpenChange }: TradeDetailsDialogProps) => {
  if (!trade) return null;

  const isProfit = trade.pnl !== null && trade.pnl >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Badge 
              variant={trade.trade_type === "long" ? "default" : "destructive"}
              className="text-sm"
            >
              {trade.trade_type === "long" ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {trade.trade_type.toUpperCase()}
            </Badge>
            <span className="text-xl font-bold">{trade.symbol}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* PnL Summary */}
          {trade.pnl !== null && (
            <div className={cn(
              "p-4 rounded-lg text-center",
              isProfit ? "bg-green-500/10" : "bg-red-500/10"
            )}>
              <div className="text-sm text-muted-foreground mb-1">רווח/הפסד</div>
              <div className={cn(
                "text-3xl font-bold",
                isProfit ? "text-green-500" : "text-red-500"
              )}>
                {isProfit ? "+" : ""}${trade.pnl.toFixed(2)}
              </div>
            </div>
          )}

          {/* Trade Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <DollarSign className="h-3 w-3" />
                מחיר כניסה
              </div>
              <div className="font-semibold">${trade.entry_price}</div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Target className="h-3 w-3" />
                מחיר יציאה
              </div>
              <div className="font-semibold">
                {trade.exit_price ? `$${trade.exit_price}` : "פתוח"}
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <BarChart3 className="h-3 w-3" />
                כמות
              </div>
              <div className="font-semibold">{trade.quantity ?? 1}</div>
            </div>


            {trade.rr !== null && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground text-xs mb-1">R:R</div>
                <div className="font-semibold">{trade.rr.toFixed(2)}</div>
              </div>
            )}

            {trade.entry_date && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="h-3 w-3" />
                  תאריך כניסה
                </div>
                <div className="font-semibold text-sm">
                  {format(new Date(trade.entry_date), "dd/MM/yyyy HH:mm", { locale: he })}
                </div>
              </div>
            )}

            {trade.exit_date && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Calendar className="h-3 w-3" />
                  תאריך יציאה
                </div>
                <div className="font-semibold text-sm">
                  {format(new Date(trade.exit_date), "dd/MM/yyyy HH:mm", { locale: he })}
                </div>
              </div>
            )}
          </div>

          {/* Strategy */}
          {trade.strategy && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1">אסטרטגיה</div>
              <div className="font-semibold">{trade.strategy}</div>
            </div>
          )}

          {/* Commission */}
          {trade.commission !== null && trade.commission > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1">עמלות</div>
              <div className="font-semibold">${trade.commission.toFixed(2)}</div>
            </div>
          )}

          {/* Notes */}
          {trade.notes && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-muted-foreground text-xs mb-1">הערות</div>
              <div className="text-sm whitespace-pre-wrap">{trade.notes}</div>
            </div>
          )}

          {/* Screenshot */}
          {trade.screenshot_url && (
            <div>
              <div className="text-muted-foreground text-xs mb-2">צילום מסך</div>
              <ImageViewer
                src={trade.screenshot_url}
                alt="Trade screenshot"
                className="w-full rounded-lg object-contain max-h-80"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
