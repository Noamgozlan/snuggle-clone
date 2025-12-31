import { useState, useCallback } from "react";
import { BacktestingChart } from "./BacktestingChart";
import { BacktestingControls } from "./BacktestingControls";
import { BacktestingTradePanel } from "./BacktestingTradePanel";
import { BacktestingReplayControls } from "./BacktestingReplayControls";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CandleData, BacktestTrade } from "./types";

export const BacktestingWorkspace = () => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [visibleCandles, setVisibleCandles] = useState<CandleData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState("EUR/USD");
  const [interval, setInterval] = useState("1h");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [accountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);

  const fetchMarketData = async (sym: string, int: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-market-data', {
        body: { symbol: sym, interval: int, outputsize: 500 }
      });

      if (error) throw error;
      
      if (data.success && data.candles) {
        setCandles(data.candles);
        // Start with first 50 candles visible
        const initialCandles = data.candles.slice(0, 50);
        setVisibleCandles(initialCandles);
        setCurrentIndex(50);
        setCurrentPrice(initialCandles[initialCandles.length - 1]?.close || 0);
        toast.success(`נטענו ${data.candles.length} נרות עבור ${sym}`);
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (error: any) {
      console.error('Error fetching market data:', error);
      toast.error(error.message || 'שגיאה בטעינת נתוני השוק');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadData = (sym: string, int: string) => {
    setSymbol(sym);
    setInterval(int);
    setTrades([]);
    fetchMarketData(sym, int);
  };

  const stepForward = useCallback(() => {
    if (currentIndex < candles.length) {
      const nextCandle = candles[currentIndex];
      setVisibleCandles(prev => [...prev, nextCandle]);
      setCurrentIndex(prev => prev + 1);
      setCurrentPrice(nextCandle.close);
      
      // Check open trades for SL/TP hits
      setTrades(prevTrades => 
        prevTrades.map(trade => {
          if (trade.status === 'open') {
            // Check SL hit
            if (trade.stopLoss) {
              if (trade.type === 'buy' && nextCandle.low <= trade.stopLoss) {
                const pnl = (trade.stopLoss - trade.entryPrice) * trade.quantity;
                return { ...trade, status: 'closed' as const, exitPrice: trade.stopLoss, exitTime: nextCandle.time, pnl };
              }
              if (trade.type === 'sell' && nextCandle.high >= trade.stopLoss) {
                const pnl = (trade.entryPrice - trade.stopLoss) * trade.quantity;
                return { ...trade, status: 'closed' as const, exitPrice: trade.stopLoss, exitTime: nextCandle.time, pnl };
              }
            }
            // Check TP hit
            if (trade.takeProfit) {
              if (trade.type === 'buy' && nextCandle.high >= trade.takeProfit) {
                const pnl = (trade.takeProfit - trade.entryPrice) * trade.quantity;
                return { ...trade, status: 'closed' as const, exitPrice: trade.takeProfit, exitTime: nextCandle.time, pnl };
              }
              if (trade.type === 'sell' && nextCandle.low <= trade.takeProfit) {
                const pnl = (trade.entryPrice - trade.takeProfit) * trade.quantity;
                return { ...trade, status: 'closed' as const, exitPrice: trade.takeProfit, exitTime: nextCandle.time, pnl };
              }
            }
          }
          return trade;
        })
      );
    }
  }, [currentIndex, candles]);

  const handleReset = () => {
    if (candles.length > 0) {
      const initialCandles = candles.slice(0, 50);
      setVisibleCandles(initialCandles);
      setCurrentIndex(50);
      setCurrentPrice(initialCandles[initialCandles.length - 1]?.close || 0);
      setTrades([]);
      setIsPlaying(false);
    }
  };

  const handleOpenTrade = (type: 'buy' | 'sell', sl?: number, tp?: number, strategy?: string) => {
    const riskAmount = accountBalance * (riskPercent / 100);
    const slDistance = sl ? Math.abs(currentPrice - sl) : currentPrice * 0.01;
    const quantity = riskAmount / slDistance;

    const newTrade: BacktestTrade = {
      id: crypto.randomUUID(),
      type,
      entryPrice: currentPrice,
      entryTime: visibleCandles[visibleCandles.length - 1]?.time || Date.now() / 1000,
      stopLoss: sl,
      takeProfit: tp,
      quantity,
      status: 'open',
      strategy,
      rr: tp && sl ? Math.abs(tp - currentPrice) / Math.abs(currentPrice - sl) : undefined,
    };

    setTrades(prev => [...prev, newTrade]);
    toast.success(`עסקת ${type === 'buy' ? 'קנייה' : 'מכירה'} נפתחה ב-${currentPrice.toFixed(5)}`);
  };

  const handleCloseTrade = (tradeId: string) => {
    setTrades(prevTrades =>
      prevTrades.map(trade => {
        if (trade.id === tradeId && trade.status === 'open') {
          const pnl = trade.type === 'buy' 
            ? (currentPrice - trade.entryPrice) * trade.quantity
            : (trade.entryPrice - currentPrice) * trade.quantity;
          return { 
            ...trade, 
            status: 'closed' as const, 
            exitPrice: currentPrice, 
            exitTime: visibleCandles[visibleCandles.length - 1]?.time || Date.now() / 1000,
            pnl 
          };
        }
        return trade;
      })
    );
    toast.success(`עסקה נסגרה ב-${currentPrice.toFixed(5)}`);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-4 p-4" dir="rtl">
      <BacktestingControls 
        onLoadData={handleLoadData}
        loading={loading}
      />
      
      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 p-4 bg-card relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : visibleCandles.length > 0 ? (
              <BacktestingChart 
                candles={visibleCandles} 
                trades={trades}
                symbol={symbol}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                בחר נכס וטווח זמן כדי להתחיל
              </div>
            )}
          </Card>
          
          <BacktestingReplayControls
            onStepForward={stepForward}
            onReset={handleReset}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playSpeed={playSpeed}
            setPlaySpeed={setPlaySpeed}
            canStep={currentIndex < candles.length}
            currentIndex={currentIndex}
            totalCandles={candles.length}
          />
        </div>
        
        <BacktestingTradePanel
          currentPrice={currentPrice}
          trades={trades}
          onOpenTrade={handleOpenTrade}
          onCloseTrade={handleCloseTrade}
          riskPercent={riskPercent}
          setRiskPercent={setRiskPercent}
          accountBalance={accountBalance}
          symbol={symbol}
        />
      </div>
    </div>
  );
};
