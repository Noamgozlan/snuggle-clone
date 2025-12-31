import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  X,
  Target,
  Shield,
  DollarSign,
  Percent
} from "lucide-react";
import type { BacktestTrade } from "./types";
import { useStrategies } from "@/hooks/useStrategies";

interface BacktestingTradePanelProps {
  currentPrice: number;
  trades: BacktestTrade[];
  onOpenTrade: (type: 'buy' | 'sell', sl?: number, tp?: number, strategy?: string) => void;
  onCloseTrade: (tradeId: string) => void;
  riskPercent: number;
  setRiskPercent: (risk: number) => void;
  accountBalance: number;
  symbol: string;
}

export const BacktestingTradePanel = ({
  currentPrice,
  trades,
  onOpenTrade,
  onCloseTrade,
  riskPercent,
  setRiskPercent,
  accountBalance,
  symbol,
}: BacktestingTradePanelProps) => {
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState("");
  const { strategies } = useStrategies();

  const openTrades = trades.filter(t => t.status === 'open');
  const closedTrades = trades.filter(t => t.status === 'closed');
  
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
  const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

  const handleOpenTrade = (type: 'buy' | 'sell') => {
    const sl = stopLoss ? parseFloat(stopLoss) : undefined;
    const tp = takeProfit ? parseFloat(takeProfit) : undefined;
    const strategy = selectedStrategy === "none" ? undefined : selectedStrategy || undefined;
    onOpenTrade(type, sl, tp, strategy);
    setStopLoss("");
    setTakeProfit("");
  };

  const riskAmount = accountBalance * (riskPercent / 100);

  return (
    <Card className="w-80 flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>פאנל מסחר</span>
          <Badge variant="outline">{symbol}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Current Price */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <span className="text-sm text-muted-foreground">מחיר נוכחי</span>
          <div className="text-2xl font-bold font-mono">
            {currentPrice.toFixed(5)}
          </div>
        </div>

        {/* Risk Management */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              סיכון לעסקה
            </Label>
            <span className="text-sm font-medium">{riskPercent}%</span>
          </div>
          <Slider
            value={[riskPercent]}
            onValueChange={(v) => setRiskPercent(v[0])}
            min={0.5}
            max={5}
            step={0.5}
          />
          <div className="text-xs text-muted-foreground text-center">
            סכום בסיכון: ${riskAmount.toFixed(2)}
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label>אסטרטגיה</Label>
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger>
              <SelectValue placeholder="בחר אסטרטגיה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">ללא</SelectItem>
              {strategies.map((s) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SL/TP Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Shield className="h-3 w-3 text-destructive" />
              סטופ לוס
            </Label>
            <Input
              type="number"
              step="0.00001"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="SL"
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <Target className="h-3 w-3 text-success" />
              טייק פרופיט
            </Label>
            <Input
              type="number"
              step="0.00001"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="TP"
              className="text-sm"
            />
          </div>
        </div>

        {/* Trade Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => handleOpenTrade('buy')}
            className="bg-success hover:bg-success/90 text-white"
            disabled={!currentPrice}
          >
            <TrendingUp className="h-4 w-4 ml-2" />
            קנייה
          </Button>
          <Button 
            onClick={() => handleOpenTrade('sell')}
            className="bg-destructive hover:bg-destructive/90 text-white"
            disabled={!currentPrice}
          >
            <TrendingDown className="h-4 w-4 ml-2" />
            מכירה
          </Button>
        </div>

        <Separator />

        {/* Open Trades */}
        {openTrades.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">עסקאות פתוחות ({openTrades.length})</h4>
            <ScrollArea className="h-24">
              {openTrades.map((trade) => {
                const unrealizedPnL = trade.type === 'buy'
                  ? (currentPrice - trade.entryPrice) * trade.quantity
                  : (trade.entryPrice - currentPrice) * trade.quantity;
                
                return (
                  <div key={trade.id} className="flex items-center justify-between p-2 bg-muted/50 rounded mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
                        {trade.type === 'buy' ? 'קנייה' : 'מכירה'}
                      </Badge>
                      <span className="text-xs">{trade.entryPrice.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono ${unrealizedPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ${unrealizedPnL.toFixed(2)}
                      </span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6"
                        onClick={() => onCloseTrade(trade.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-auto pt-2 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">סה״כ עסקאות</span>
            <span className="font-medium">{closedTrades.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">אחוז הצלחה</span>
            <span className="font-medium">{winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">רווח/הפסד</span>
            <span className={`font-medium ${totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${totalPnL.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
