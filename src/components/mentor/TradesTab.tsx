import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  Target, 
  AlertCircle,
  Image,
  CheckCircle2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useState } from "react";

interface TradeConfirmation {
  id: string;
  confirmation_name: string;
}

interface StudentTrade {
  id: string;
  symbol: string;
  trade_type: string;
  pnl: number | null;
  entry_date: string | null;
  created_at: string;
  is_closed: boolean;
  notes: string | null;
  screenshot_url: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  rr: number | null;
  strategy: string | null;
  portfolio_id: string | null;
  portfolio_name?: string;
  confirmations?: TradeConfirmation[];
}

interface TradesTabProps {
  trades: StudentTrade[];
  loading: boolean;
  onViewTrade: (trade: StudentTrade) => void;
  onGiveFeedback: (tradeId: string) => void;
}

export const TradesTab = ({ trades, loading, onViewTrade, onGiveFeedback }: TradesTabProps) => {
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);

  if (loading) {
    return (
      <TabsContent value="trades" className="mt-4">
        <Card className="bg-card border-border">
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </Card>
      </TabsContent>
    );
  }

  if (trades.length === 0) {
    return (
      <TabsContent value="trades" className="mt-4">
        <Card className="bg-card border-border">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">אין עסקאות עדיין</p>
          </div>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="trades" className="mt-4">
      <Card className="bg-card border-border p-2 md:p-4">
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {trades.map((trade) => {
            const isExpanded = expandedTradeId === trade.id;
            
            return (
              <div
                key={trade.id}
                className={`rounded-xl border-2 transition-all overflow-hidden ${
                  isExpanded
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30 hover:border-primary/50"
                }`}
              >
                {/* Trade Header - Always visible */}
                <button 
                  className="w-full p-3 md:p-4 text-right"
                  onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${trade.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                        {trade.trade_type === 'long' 
                          ? <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 text-success" />
                          : <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-base md:text-lg">{trade.symbol}</span>
                          <Badge variant={trade.is_closed ? 'outline' : 'secondary'} className="text-[10px] md:text-xs">
                            {trade.is_closed ? 'סגורה' : 'פתוחה'}
                          </Badge>
                        </div>
                        <p className="text-[10px] md:text-xs text-muted-foreground">
                          {format(new Date(trade.entry_date || trade.created_at), 'dd/MM/yyyy', { locale: he })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {trade.pnl !== null && (
                        <p className={`text-lg md:text-xl font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                        </p>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Trade Details - Expandable */}
                {isExpanded && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 pt-0 border-t border-border/50 space-y-3">
                    {/* Quick Info */}
                    <div className="flex flex-wrap gap-2 pt-3">
                      {trade.portfolio_name && (
                        <Badge variant="outline" className="text-xs">
                          <Briefcase className="h-3 w-3 ml-1" />
                          {trade.portfolio_name}
                        </Badge>
                      )}
                      {trade.strategy && (
                        <Badge variant="secondary" className="text-xs">
                          <Target className="h-3 w-3 ml-1" />
                          {trade.strategy}
                        </Badge>
                      )}
                    </div>

                    {/* Trade Data Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="bg-background/60 p-2 md:p-3 rounded-lg">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1">כניסה</p>
                        <p className="font-semibold text-foreground text-sm">${trade.entry_price}</p>
                      </div>
                      {trade.exit_price && (
                        <div className="bg-background/60 p-2 md:p-3 rounded-lg">
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">יציאה</p>
                          <p className="font-semibold text-foreground text-sm">${trade.exit_price}</p>
                        </div>
                      )}
                      <div className="bg-background/60 p-2 md:p-3 rounded-lg">
                        <p className="text-[10px] md:text-xs text-muted-foreground mb-1">כמות</p>
                        <p className="font-semibold text-foreground text-sm">{trade.quantity}</p>
                      </div>
                      {trade.rr && (
                        <div className="bg-background/60 p-2 md:p-3 rounded-lg">
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-1">R:R</p>
                          <p className="font-semibold text-foreground text-sm">{trade.rr.toFixed(1)}R</p>
                        </div>
                      )}
                    </div>

                    {/* Confirmations */}
                    {trade.confirmations && trade.confirmations.length > 0 && (
                      <div className="bg-background/60 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">אישורים:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {trade.confirmations.map((conf) => (
                            <Badge key={conf.id} variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                              <CheckCircle2 className="h-3 w-3 ml-1" />
                              {conf.confirmation_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {trade.notes && (
                      <div className="bg-background/60 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">הערות:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{trade.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {trade.screenshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTrade(trade)}
                          className="flex-1"
                        >
                          <Image className="h-4 w-4 ml-1" />
                          צפה בתמונה
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => onGiveFeedback(trade.id)}
                        className="flex-1"
                      >
                        <TrendingUp className="h-4 w-4 ml-1" />
                        תן משוב
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </TabsContent>
  );
};
