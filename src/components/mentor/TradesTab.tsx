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
  ChevronUp,
  MessageSquare,
  Calendar,
  DollarSign,
  Layers
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
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <p className="text-muted-foreground text-sm">טוען עסקאות...</p>
          </div>
        </Card>
      </TabsContent>
    );
  }

  if (trades.length === 0) {
    return (
      <TabsContent value="trades" className="mt-4">
        <Card className="bg-card border-border">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-muted/50 mb-4">
              <Layers className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">אין עסקאות עדיין</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              כשהתלמיד יתחיל לבצע עסקאות, הן יופיעו כאן
            </p>
          </div>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="trades" className="mt-4">
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-3 md:p-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground text-sm">היסטוריית עסקאות</span>
            </div>
            <Badge variant="secondary" className="font-semibold">
              {trades.length} עסקאות
            </Badge>
          </div>
        </div>
        
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {trades.map((trade) => {
            const isExpanded = expandedTradeId === trade.id;
            const isWin = trade.pnl !== null && trade.pnl > 0;
            const isLoss = trade.pnl !== null && trade.pnl < 0;
            
            return (
              <div
                key={trade.id}
                className={`transition-all duration-300 ${
                  isExpanded ? "bg-muted/30" : "hover:bg-muted/20"
                }`}
              >
                {/* Trade Header - Always visible */}
                <button 
                  className="w-full p-4 text-right"
                  onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        trade.trade_type === 'long' 
                          ? 'bg-gradient-to-br from-success/30 to-success/10' 
                          : 'bg-gradient-to-br from-destructive/30 to-destructive/10'
                      }`}>
                        {trade.trade_type === 'long' 
                          ? <ArrowUpRight className="h-5 w-5 text-success" />
                          : <ArrowDownRight className="h-5 w-5 text-destructive" />
                        }
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground text-lg">{trade.symbol}</span>
                          <Badge 
                            variant={trade.is_closed ? 'outline' : 'secondary'} 
                            className={`text-xs ${trade.is_closed ? '' : 'bg-amber-500/20 text-amber-600 border-amber-500/30'}`}
                          >
                            {trade.is_closed ? 'סגורה' : 'פתוחה'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(trade.entry_date || trade.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {trade.pnl !== null && (
                        <div className={`px-3 py-1.5 rounded-xl font-bold text-lg ${
                          isWin 
                            ? 'bg-success/20 text-success' 
                            : isLoss 
                              ? 'bg-destructive/20 text-destructive' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                        </div>
                      )}
                      <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-primary/10' : 'bg-muted/50'}`}>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-primary" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Trade Details - Expandable */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 animate-fade-in">
                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2">
                      {trade.portfolio_name && (
                        <Badge variant="outline" className="text-xs bg-background/50">
                          <Briefcase className="h-3 w-3 ml-1 text-amber-500" />
                          {trade.portfolio_name}
                        </Badge>
                      )}
                      {trade.strategy && (
                        <Badge variant="outline" className="text-xs bg-background/50">
                          <Target className="h-3 w-3 ml-1 text-purple-500" />
                          {trade.strategy}
                        </Badge>
                      )}
                      {trade.rr && (
                        <Badge variant="outline" className="text-xs bg-background/50">
                          R:R {trade.rr.toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    {/* Trade Data Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-background rounded-xl p-3 border border-border/50">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-xs">כניסה</span>
                        </div>
                        <p className="font-bold text-foreground">${trade.entry_price}</p>
                      </div>
                      {trade.exit_price && (
                        <div className="bg-background rounded-xl p-3 border border-border/50">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="text-xs">יציאה</span>
                          </div>
                          <p className="font-bold text-foreground">${trade.exit_price}</p>
                        </div>
                      )}
                      <div className="bg-background rounded-xl p-3 border border-border/50">
                        <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                          <Layers className="h-3 w-3" />
                          <span className="text-xs">כמות</span>
                        </div>
                        <p className="font-bold text-foreground">{trade.quantity}</p>
                      </div>
                      {trade.rr && (
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 border border-primary/20">
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                            <Target className="h-3 w-3" />
                            <span className="text-xs">יחס R:R</span>
                          </div>
                          <p className="font-bold text-primary">{trade.rr.toFixed(2)}R</p>
                        </div>
                      )}
                    </div>

                    {/* Confirmations */}
                    {trade.confirmations && trade.confirmations.length > 0 && (
                      <div className="bg-success/5 rounded-xl p-3 border border-success/20">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          אישורים לעסקה
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {trade.confirmations.map((conf) => (
                            <Badge key={conf.id} className="bg-success/20 text-success border-success/30 text-xs">
                              {conf.confirmation_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {trade.notes && (
                      <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1.5">הערות:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{trade.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {trade.screenshot_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewTrade(trade)}
                          className="flex-1 gap-2"
                        >
                          <Image className="h-4 w-4" />
                          צפה בגרף
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => onGiveFeedback(trade.id)}
                        className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/90"
                      >
                        <MessageSquare className="h-4 w-4" />
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