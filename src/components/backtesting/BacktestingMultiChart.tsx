import { useEffect, useRef, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  createSeriesMarkers,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { CandleData, BacktestTrade } from "./types";
import { Badge } from "@/components/ui/badge";

interface BacktestingMultiChartProps {
  chartsData: {
    id: string;
    candles: CandleData[];
    symbol: string;
    interval: string;
  }[];
  trades: BacktestTrade[];
  layout: "1" | "2h" | "2v" | "4";
}

const getGridClass = (layout: string) => {
  switch (layout) {
    case "2h":
      return "grid-cols-2 grid-rows-1";
    case "2v":
      return "grid-cols-1 grid-rows-2";
    case "4":
      return "grid-cols-2 grid-rows-2";
    default:
      return "grid-cols-1 grid-rows-1";
  }
};

const ChartPanel = ({
  candles,
  trades,
  symbol,
  interval,
}: {
  candles: CandleData[];
  trades: BacktestTrade[];
  symbol: string;
  interval: string;
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick", Time> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.5)" },
        horzLines: { color: "rgba(42, 46, 57, 0.5)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(42, 46, 57, 0.8)" },
      timeScale: {
        borderColor: "rgba(42, 46, 57, 0.8)",
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    markersRef.current = createSeriesMarkers(candlestickSeries, []);

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      const seen = new Set<number>();
      const chartData: CandlestickData<Time>[] = [];

      for (const c of candles) {
        const t = Number(c.time);
        if (!Number.isFinite(t) || seen.has(t)) continue;
        seen.add(t);
        chartData.push({
          time: t as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        });
      }

      chartData.sort((a, b) => (a.time as number) - (b.time as number));
      seriesRef.current.setData(chartData);

      if (chartRef.current) {
        chartRef.current.timeScale().scrollToRealTime();
      }
    }
  }, [candles]);

  useEffect(() => {
    if (!markersRef.current) return;

    if (trades.length === 0) {
      markersRef.current.setMarkers([]);
      return;
    }

    const markers: SeriesMarker<Time>[] = trades.flatMap((trade) => {
      const entryMarker: SeriesMarker<Time> = {
        time: trade.entryTime as Time,
        position: trade.type === "buy" ? "belowBar" : "aboveBar",
        color: trade.type === "buy" ? "#22c55e" : "#ef4444",
        shape: trade.type === "buy" ? "arrowUp" : "arrowDown",
        text: trade.type === "buy" ? "BUY" : "SELL",
      };

      if (trade.status === "closed" && trade.exitTime) {
        const exitMarker: SeriesMarker<Time> = {
          time: trade.exitTime as Time,
          position: trade.type === "buy" ? "aboveBar" : "belowBar",
          color: (trade.pnl || 0) >= 0 ? "#22c55e" : "#ef4444",
          shape: "circle",
          text: "EXIT",
        };
        return [entryMarker, exitMarker];
      }

      return [entryMarker];
    });

    markersRef.current.setMarkers(markers);
  }, [trades]);

  return (
    <div className="relative w-full h-full bg-card rounded-lg border overflow-hidden">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Badge variant="outline" className="text-xs">
          {symbol}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {interval}
        </Badge>
      </div>
      <div ref={chartContainerRef} className="w-full h-full" />
    </div>
  );
};

export const BacktestingMultiChart = ({
  chartsData,
  trades,
  layout,
}: BacktestingMultiChartProps) => {
  const visibleCharts = useMemo(() => {
    const count = layout === "4" ? 4 : layout === "1" ? 1 : 2;
    return chartsData.slice(0, count);
  }, [chartsData, layout]);

  if (visibleCharts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        בחר נכס וטווח זמן כדי להתחיל
      </div>
    );
  }

  return (
    <div className={`grid gap-2 h-full ${getGridClass(layout)}`}>
      {visibleCharts.map((chartData) => (
        <ChartPanel
          key={chartData.id}
          candles={chartData.candles}
          trades={trades}
          symbol={chartData.symbol}
          interval={chartData.interval}
        />
      ))}
    </div>
  );
};
