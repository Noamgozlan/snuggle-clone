import { useMemo } from "react";
import type { CandleData, IndicatorConfig } from "./types";

interface ChartLegendProps {
  symbol: string;
  interval: string;
  currentCandle: CandleData | null;
  previousCandle: CandleData | null;
  indicators: IndicatorConfig[];
  indicatorValues?: Record<string, number | { value: number; color?: string }>;
}

export const ChartLegend = ({
  symbol,
  interval,
  currentCandle,
  previousCandle,
  indicators,
  indicatorValues = {},
}: ChartLegendProps) => {
  const priceChange = useMemo(() => {
    if (!currentCandle || !previousCandle) return null;
    const change = currentCandle.close - previousCandle.close;
    const changePercent = (change / previousCandle.close) * 100;
    return { change, changePercent };
  }, [currentCandle, previousCandle]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  };

  return (
    <div className="absolute top-2 right-2 z-10 flex flex-wrap items-center gap-3 text-xs font-mono">
      {/* Symbol & Interval */}
      <div className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded px-2 py-1 border border-border/50">
        <span className="font-semibold text-foreground">{symbol}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-muted-foreground">{interval}</span>
      </div>

      {/* OHLC */}
      {currentCandle && (
        <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm rounded px-2 py-1 border border-border/50">
          <span className="text-muted-foreground">O</span>
          <span className="text-foreground">{formatPrice(currentCandle.open)}</span>
          <span className="text-muted-foreground">H</span>
          <span className="text-foreground">{formatPrice(currentCandle.high)}</span>
          <span className="text-muted-foreground">L</span>
          <span className="text-foreground">{formatPrice(currentCandle.low)}</span>
          <span className="text-muted-foreground">C</span>
          <span className="text-foreground">{formatPrice(currentCandle.close)}</span>
          
          {priceChange && (
            <>
              <span className="text-muted-foreground">|</span>
              <span
                className={
                  priceChange.change >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {priceChange.change >= 0 ? "+" : ""}
                {priceChange.changePercent.toFixed(2)}%
              </span>
            </>
          )}

          {currentCandle.volume && (
            <>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">Vol</span>
              <span className="text-foreground">
                {currentCandle.volume >= 1000000
                  ? `${(currentCandle.volume / 1000000).toFixed(2)}M`
                  : currentCandle.volume >= 1000
                  ? `${(currentCandle.volume / 1000).toFixed(2)}K`
                  : currentCandle.volume.toFixed(0)}
              </span>
            </>
          )}
        </div>
      )}

      {/* Indicator Values */}
      {indicators.filter((i) => i.enabled).map((indicator) => {
        const value = indicatorValues[indicator.id];
        if (value === undefined) return null;

        const displayValue = typeof value === "object" ? value.value : value;
        
        return (
          <div
            key={indicator.id}
            className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm rounded px-2 py-1 border border-border/50"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: indicator.color }}
            />
            <span className="text-muted-foreground uppercase">
              {indicator.type}
              {indicator.params.period && `(${indicator.params.period})`}
            </span>
            <span className="text-foreground">{displayValue.toFixed(2)}</span>
          </div>
        );
      })}
    </div>
  );
};
