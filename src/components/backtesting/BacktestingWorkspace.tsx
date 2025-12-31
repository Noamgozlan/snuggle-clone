import { useState, useCallback, useMemo } from "react";
import { BacktestingMultiChart } from "./BacktestingMultiChart";
import { BacktestingControls } from "./BacktestingControls";
import { BacktestingTradePanel } from "./BacktestingTradePanel";
import { BacktestingReplayControls } from "./BacktestingReplayControls";
import { BacktestingDatePicker } from "./BacktestingDatePicker";
import { BacktestingLayoutSelector } from "./BacktestingLayoutSelector";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CandleData, BacktestTrade } from "./types";

interface ChartConfig {
  id: string;
  symbol: string;
  interval: string;
  candles: CandleData[];
  visibleCandles: CandleData[];
  currentIndex: number;
}

export const BacktestingWorkspace = () => {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [accountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [layout, setLayout] = useState<"1" | "2h" | "2v" | "4">("1");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  const normalizeCandles = useCallback((input: CandleData[]) => {
    const sorted = [...input].sort((a, b) => a.time - b.time);
    const out: CandleData[] = [];
    let lastTime: number | null = null;

    for (const c of sorted) {
      const t = Number(c.time);
      if (!Number.isFinite(t)) continue;
      if (lastTime === t) continue;
      lastTime = t;
      out.push({ ...c, time: t });
    }

    return out;
  }, []);

  const fetchMarketData = async (sym: string, int: string, chartId?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-market-data", {
        body: { symbol: sym, interval: int, outputsize: 500 },
      });

      if (error) throw error;

      if (data.success && data.candles) {
        let cleanedCandles = normalizeCandles(data.candles);

        // Filter by start date if selected
        if (startDate) {
          const startTimestamp = startDate.getTime() / 1000;
          cleanedCandles = cleanedCandles.filter((c) => c.time >= startTimestamp);
        }

        if (cleanedCandles.length < 50) {
          toast.error("אין מספיק נתונים לתאריך שנבחר");
          setLoading(false);
          return;
        }

        const initialCandles = cleanedCandles.slice(0, 50);

        const newChart: ChartConfig = {
          id: chartId || crypto.randomUUID(),
          symbol: sym,
          interval: int,
          candles: cleanedCandles,
          visibleCandles: initialCandles,
          currentIndex: 50,
        };

        setCharts((prev) => {
          if (chartId) {
            return prev.map((c) => (c.id === chartId ? newChart : c));
          }
          // If we have max charts for current layout, replace the first one
          const maxCharts = layout === "4" ? 4 : layout === "1" ? 1 : 2;
          if (prev.length >= maxCharts) {
            return [...prev.slice(1), newChart];
          }
          return [...prev, newChart];
        });

        toast.success(`נטענו ${cleanedCandles.length} נרות עבור ${sym} (${int})`);
      } else {
        throw new Error(data.error || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Error fetching market data:", error);
      toast.error(error.message || "שגיאה בטעינת נתוני השוק");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadData = (sym: string, int: string) => {
    setTrades([]);
    fetchMarketData(sym, int);
  };

  const currentPrice = useMemo(() => {
    if (charts.length === 0) return 0;
    const mainChart = charts[0];
    const lastCandle = mainChart.visibleCandles[mainChart.visibleCandles.length - 1];
    return lastCandle?.close || 0;
  }, [charts]);

  const mainSymbol = charts[0]?.symbol || "EUR/USD";

  const stepForward = useCallback(
    (steps = 1) => {
      setCharts((prevCharts) =>
        prevCharts.map((chart) => {
          const newIndex = Math.min(chart.currentIndex + steps, chart.candles.length);
          const newVisibleCandles = chart.candles.slice(0, newIndex);
          return {
            ...chart,
            visibleCandles: newVisibleCandles,
            currentIndex: newIndex,
          };
        })
      );

      // Check trades for SL/TP hits using main chart
      setTrades((prevTrades) =>
        prevTrades.map((trade) => {
          if (trade.status !== "open" || charts.length === 0) return trade;

          const mainChart = charts[0];
          const nextCandle = mainChart.candles[mainChart.currentIndex];
          if (!nextCandle) return trade;

          if (trade.stopLoss) {
            if (trade.type === "buy" && nextCandle.low <= trade.stopLoss) {
              const pnl = (trade.stopLoss - trade.entryPrice) * trade.quantity;
              return { ...trade, status: "closed", exitPrice: trade.stopLoss, exitTime: nextCandle.time, pnl };
            }
            if (trade.type === "sell" && nextCandle.high >= trade.stopLoss) {
              const pnl = (trade.entryPrice - trade.stopLoss) * trade.quantity;
              return { ...trade, status: "closed", exitPrice: trade.stopLoss, exitTime: nextCandle.time, pnl };
            }
          }
          if (trade.takeProfit) {
            if (trade.type === "buy" && nextCandle.high >= trade.takeProfit) {
              const pnl = (trade.takeProfit - trade.entryPrice) * trade.quantity;
              return { ...trade, status: "closed", exitPrice: trade.takeProfit, exitTime: nextCandle.time, pnl };
            }
            if (trade.type === "sell" && nextCandle.low <= trade.takeProfit) {
              const pnl = (trade.entryPrice - trade.takeProfit) * trade.quantity;
              return { ...trade, status: "closed", exitPrice: trade.takeProfit, exitTime: nextCandle.time, pnl };
            }
          }
          return trade;
        })
      );
    },
    [charts]
  );

  const handleReset = () => {
    setCharts((prevCharts) =>
      prevCharts.map((chart) => ({
        ...chart,
        visibleCandles: chart.candles.slice(0, 50),
        currentIndex: 50,
      }))
    );
    setTrades([]);
    setIsPlaying(false);
  };

  const handleOpenTrade = (type: "buy" | "sell", sl?: number, tp?: number, strategy?: string) => {
    const riskAmount = accountBalance * (riskPercent / 100);
    const slDistance = sl ? Math.abs(currentPrice - sl) : currentPrice * 0.01;
    const quantity = riskAmount / slDistance;

    const mainChart = charts[0];
    const entryTime = mainChart?.visibleCandles[mainChart.visibleCandles.length - 1]?.time || Date.now() / 1000;

    const newTrade: BacktestTrade = {
      id: crypto.randomUUID(),
      type,
      entryPrice: currentPrice,
      entryTime,
      stopLoss: sl,
      takeProfit: tp,
      quantity,
      status: "open",
      strategy,
      rr: tp && sl ? Math.abs(tp - currentPrice) / Math.abs(currentPrice - sl) : undefined,
    };

    setTrades((prev) => [...prev, newTrade]);
    toast.success(`עסקת ${type === "buy" ? "קנייה" : "מכירה"} נפתחה ב-${currentPrice.toFixed(5)}`);
  };

  const handleCloseTrade = (tradeId: string) => {
    const mainChart = charts[0];
    const exitTime = mainChart?.visibleCandles[mainChart.visibleCandles.length - 1]?.time || Date.now() / 1000;

    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId && trade.status === "open") {
          const pnl =
            trade.type === "buy"
              ? (currentPrice - trade.entryPrice) * trade.quantity
              : (trade.entryPrice - currentPrice) * trade.quantity;
          return { ...trade, status: "closed", exitPrice: currentPrice, exitTime, pnl };
        }
        return trade;
      })
    );
    toast.success(`עסקה נסגרה ב-${currentPrice.toFixed(5)}`);
  };

  const chartsData = useMemo(
    () =>
      charts.map((chart) => ({
        id: chart.id,
        candles: chart.visibleCandles,
        symbol: chart.symbol,
        interval: chart.interval,
      })),
    [charts]
  );

  const canStep = charts.length > 0 && charts.some((c) => c.currentIndex < c.candles.length);
  const totalCandles = charts[0]?.candles.length || 0;
  const currentIndex = charts[0]?.currentIndex || 0;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-4 p-4" dir="rtl">
      <div className="flex items-center gap-4 flex-wrap">
        <BacktestingControls onLoadData={handleLoadData} loading={loading} />
        <BacktestingDatePicker date={startDate} onDateChange={setStartDate} disabled={loading} />
        <BacktestingLayoutSelector layout={layout} onLayoutChange={setLayout} />
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col gap-4">
          <Card className="flex-1 p-4 bg-card relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <BacktestingMultiChart chartsData={chartsData} trades={trades} layout={layout} />
            )}
          </Card>

          <BacktestingReplayControls
            onStepForward={stepForward}
            onReset={handleReset}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            playSpeed={playSpeed}
            setPlaySpeed={setPlaySpeed}
            canStep={canStep}
            currentIndex={currentIndex}
            totalCandles={totalCandles}
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
          symbol={mainSymbol}
        />
      </div>
    </div>
  );
};
