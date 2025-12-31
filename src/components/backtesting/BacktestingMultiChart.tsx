import { useMemo } from "react";
import type { CandleData, BacktestTrade } from "./types";
import { TradingViewChart } from "./TradingViewChart";

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
        <TradingViewChart
          key={chartData.id}
          candles={chartData.candles}
          trades={trades}
          symbol={chartData.symbol}
          interval={chartData.interval}
          showToolbar={layout === "1" || visibleCharts.length <= 2}
        />
      ))}
    </div>
  );
};
