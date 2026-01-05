import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, Calendar, Target, DollarSign, Edit, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Trade } from "@/hooks/useTrades";
import { ImageViewer } from "@/components/ui/image-viewer";

interface TradeSummaryDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  confirmations?: string[];
}

export const TradeSummaryDialog = ({ trade, open, onOpenChange, onEdit, confirmations = [] }: TradeSummaryDialogProps) => {
  if (!trade) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "—";
    return `$${price.toFixed(2)}`;
  };

  const isWin = (trade.pnl || 0) >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain bg-card border-border">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <span
              className={cn(
                "px-2 py-1 rounded text-sm",
                trade.trade_type === "long" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
              )}
            >
              {trade.trade_type.toUpperCase()}
            </span>
            {trade.symbol}
          </DialogTitle>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-2">
            <Edit className="h-4 w-4" />
            ערוך
          </Button>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Main Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card
              className={cn(
                "p-4 text-center",
                isWin ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30",
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                {isWin ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">רווח/הפסד</span>
              </div>
              <p className={cn("text-2xl font-bold", isWin ? "text-success" : "text-destructive")}>
                {isWin ? "+" : ""}
                {formatPrice(trade.pnl)}
              </p>
            </Card>

            <Card className="p-4 text-center bg-secondary/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">RR</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{trade.rr ? trade.rr.toFixed(2) : "—"}</p>
            </Card>

            <Card className="p-4 text-center bg-secondary/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">תאריך</span>
              </div>
              <p className="text-lg font-medium text-foreground">{formatDate(trade.entry_date || trade.created_at)}</p>
            </Card>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">מחיר כניסה:</span>
                <span className="font-medium">{trade.entry_price !== 0 ? formatPrice(trade.entry_price) : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">מחיר יציאה:</span>
                <span className="font-medium">
                  {trade.exit_price !== null && trade.exit_price !== 0 ? formatPrice(trade.exit_price) : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">כמות:</span>
                <span className="font-medium">{trade.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">סיכון:</span>
                <span className="font-medium">{trade.risk ? formatPrice(trade.risk) : "—"}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">נקודות:</span>
                <span className="font-medium">{trade.pnl_points ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">אסטרטגיה:</span>
                <span className="font-medium">{trade.strategy || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">דירוג:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= (trade.rating || 0) ? "fill-warning text-warning" : "text-muted-foreground",
                      )}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">סטטוס:</span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    trade.is_closed ? "bg-success/20 text-success" : "bg-warning/20 text-warning",
                  )}
                >
                  {trade.is_closed ? "סגורה" : "פתוחה"}
                </span>
          </div>

          {/* Confirmations */}
          {confirmations.length > 0 && (
            <Card className="p-4 bg-secondary/30">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                אישורים ({confirmations.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {confirmations.map((confirmation, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/20 text-primary">
                    {confirmation}
                  </Badge>
                ))}
              </div>
            </Card>
          )}
            </div>
          </div>

          {/* Notes - Split into Entry Reason and Conclusions */}
          {trade.notes && (
            <div className="grid grid-cols-2 gap-4">
              {(() => {
                const [reason, ...rest] = (trade.notes || "").split("\n\n[CONCLUSIONS]\n");
                const conclusions = rest.join("\n\n[CONCLUSIONS]\n");

                return (
                  <>
                    <Card className="p-4 bg-secondary/30 flex flex-col">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">סיבת כניסה לעסקה</h4>
                      <div className="flex-1 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                        <p className="text-foreground text-sm whitespace-pre-wrap break-words text-right" dir="rtl">
                          {reason || "—"}
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 bg-secondary/30 flex flex-col">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">מסקנות לאחר העסקה</h4>
                      <div className="flex-1 max-h-[150px] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                        <p className="text-foreground text-sm whitespace-pre-wrap break-words text-right" dir="rtl">
                          {conclusions || "—"}
                        </p>
                      </div>
                    </Card>
                  </>
                );
              })()}
            </div>
          )}

          {/* Screenshot */}
          {trade.screenshot_url && (
            <Card className="p-4 bg-secondary/30">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">צילום מסך</h4>
              <div className="rounded-lg overflow-hidden border border-border">
                <ImageViewer
                  src={trade.screenshot_url}
                  alt="Trade screenshot"
                  className="w-full h-auto max-h-[400px] object-contain bg-background"
                />
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
