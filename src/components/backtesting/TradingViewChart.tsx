import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  createSeriesMarkers,
  type CandlestickData,
  type LineData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
  type MouseEventParams,
} from "lightweight-charts";
import type { CandleData, BacktestTrade, ChartSettings, IndicatorConfig } from "./types";
import { ChartToolbar } from "./ChartToolbar";
import { ChartLegend } from "./ChartLegend";
import { DEFAULT_CHART_SETTINGS } from "./types";
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  convertToHeikinAshi,
} from "./utils/indicators";

interface TradingViewChartProps {
  candles: CandleData[];
  trades: BacktestTrade[];
  symbol: string;
  interval: string;
  showToolbar?: boolean;
}

export const TradingViewChart = ({
  candles,
  trades,
  symbol,
  interval,
  showToolbar = true,
}: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area", Time> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram", Time> | null>(null);
  const indicatorSeriesRef = useRef<Map<string, ISeriesApi<"Line" | "Histogram", Time>[]>>(new Map());
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const [settings, setSettings] = useState<ChartSettings>(DEFAULT_CHART_SETTINGS);
  const [crosshairData, setCrosshairData] = useState<{
    candle: CandleData | null;
    prevCandle: CandleData | null;
  }>({ candle: null, prevCandle: null });
  const [indicatorValues, setIndicatorValues] = useState<Record<string, number>>({});

  // Process candles based on chart type
  const processedCandles = useMemo(() => {
    if (settings.chartType === "heikinAshi") {
      return convertToHeikinAshi(candles);
    }
    return candles;
  }, [candles, settings.chartType]);

  // Calculate indicators
  const calculatedIndicators = useMemo(() => {
    const results: Record<string, any> = {};

    for (const indicator of settings.indicators) {
      if (!indicator.enabled) continue;

      switch (indicator.type) {
        case "sma":
          results[indicator.id] = calculateSMA(candles, indicator.params.period || 20);
          break;
        case "ema":
          results[indicator.id] = calculateEMA(candles, indicator.params.period || 9);
          break;
        case "bollinger":
          results[indicator.id] = calculateBollingerBands(
            candles,
            indicator.params.period || 20,
            indicator.params.stdDev || 2
          );
          break;
        case "rsi":
          results[indicator.id] = calculateRSI(candles, indicator.params.period || 14);
          break;
        case "macd":
          results[indicator.id] = calculateMACD(
            candles,
            indicator.params.fast || 12,
            indicator.params.slow || 26,
            indicator.params.signal || 9
          );
          break;
      }
    }

    return results;
  }, [candles, settings.indicators]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { 
          color: settings.showGrid ? "rgba(42, 46, 57, 0.5)" : "transparent" 
        },
        horzLines: { 
          color: settings.showGrid ? "rgba(42, 46, 57, 0.5)" : "transparent" 
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: "rgba(224, 227, 235, 0.4)",
          style: 0,
          labelBackgroundColor: "#1e293b",
        },
        horzLine: {
          width: 1,
          color: "rgba(224, 227, 235, 0.4)",
          style: 0,
          labelBackgroundColor: "#1e293b",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(42, 46, 57, 0.8)",
        scaleMargins: {
          top: 0.1,
          bottom: settings.showVolume ? 0.25 : 0.1,
        },
      },
      timeScale: {
        borderColor: "rgba(42, 46, 57, 0.8)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 10,
        minBarSpacing: 2,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    chartRef.current = chart;

    // Handle crosshair move
    chart.subscribeCrosshairMove((param: MouseEventParams<Time>) => {
      if (!param.time) {
        setCrosshairData({ candle: null, prevCandle: null });
        setIndicatorValues({});
        return;
      }

      const time = param.time as number;
      const candleIndex = processedCandles.findIndex((c) => c.time === time);
      
      if (candleIndex !== -1) {
        setCrosshairData({
          candle: processedCandles[candleIndex],
          prevCandle: candleIndex > 0 ? processedCandles[candleIndex - 1] : null,
        });

        // Update indicator values
        const values: Record<string, number> = {};
        for (const [id, data] of Object.entries(calculatedIndicators)) {
          if (Array.isArray(data)) {
            const point = data.find((d: any) => d.time === time);
            if (point?.value !== undefined) {
              values[id] = point.value;
            }
          } else if (data.middle) {
            const point = data.middle.find((d: any) => d.time === time);
            if (point?.value !== undefined) {
              values[id] = point.value;
            }
          }
        }
        setIndicatorValues(values);
      }
    });

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

  // Update grid visibility
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({
      grid: {
        vertLines: { 
          color: settings.showGrid ? "rgba(42, 46, 57, 0.5)" : "transparent" 
        },
        horzLines: { 
          color: settings.showGrid ? "rgba(42, 46, 57, 0.5)" : "transparent" 
        },
      },
    });
  }, [settings.showGrid]);

  // Update price scale margins for volume
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: settings.showVolume ? 0.25 : 0.1,
        },
      },
    });
  }, [settings.showVolume]);

  // Create/update main series based on chart type
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old main series
    if (mainSeriesRef.current) {
      chartRef.current.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
      markersRef.current = null;
    }

    // Create new series based on chart type
    if (settings.chartType === "candles" || settings.chartType === "heikinAshi") {
      const series = chartRef.current.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderDownColor: "#ef4444",
        borderUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        wickUpColor: "#22c55e",
      });
      mainSeriesRef.current = series;
      markersRef.current = createSeriesMarkers(series, []);
    } else if (settings.chartType === "line") {
      const series = chartRef.current.addSeries(LineSeries, {
        color: "#2563eb",
        lineWidth: 2,
      });
      mainSeriesRef.current = series as any;
    } else if (settings.chartType === "area") {
      const series = chartRef.current.addSeries(AreaSeries, {
        topColor: "rgba(37, 99, 235, 0.4)",
        bottomColor: "rgba(37, 99, 235, 0.0)",
        lineColor: "#2563eb",
        lineWidth: 2,
      });
      mainSeriesRef.current = series as any;
    }
  }, [settings.chartType]);

  // Update main series data
  useEffect(() => {
    if (!mainSeriesRef.current || processedCandles.length === 0) return;

    const seen = new Set<number>();
    
    if (settings.chartType === "candles" || settings.chartType === "heikinAshi") {
      const chartData: CandlestickData<Time>[] = [];
      
      for (const c of processedCandles) {
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
      mainSeriesRef.current.setData(chartData as any);
    } else {
      const chartData: LineData<Time>[] = [];
      
      for (const c of processedCandles) {
        const t = Number(c.time);
        if (!Number.isFinite(t) || seen.has(t)) continue;
        seen.add(t);
        chartData.push({
          time: t as Time,
          value: c.close,
        });
      }
      
      chartData.sort((a, b) => (a.time as number) - (b.time as number));
      mainSeriesRef.current.setData(chartData as any);
    }

    if (chartRef.current) {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [processedCandles, settings.chartType]);

  // Update volume series
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old volume series
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    if (!settings.showVolume || candles.length === 0) return;

    const volumeSeries = chartRef.current.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });

    chartRef.current.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    const volumeData: HistogramData<Time>[] = candles
      .filter((c) => c.volume !== undefined)
      .map((c, i) => ({
        time: c.time as Time,
        value: c.volume || 0,
        color:
          i === 0
            ? "rgba(107, 114, 128, 0.5)"
            : c.close >= candles[i - 1].close
            ? "rgba(34, 197, 94, 0.5)"
            : "rgba(239, 68, 68, 0.5)",
      }));

    volumeSeries.setData(volumeData);
    volumeSeriesRef.current = volumeSeries;
  }, [settings.showVolume, candles]);

  // Update indicator series
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old indicator series
    for (const [, seriesArray] of indicatorSeriesRef.current) {
      for (const series of seriesArray) {
        chartRef.current.removeSeries(series);
      }
    }
    indicatorSeriesRef.current.clear();

    // Add new indicator series
    for (const indicator of settings.indicators) {
      if (!indicator.enabled) continue;

      const data = calculatedIndicators[indicator.id];
      if (!data) continue;

      const seriesArray: ISeriesApi<"Line" | "Histogram", Time>[] = [];

      if (indicator.type === "sma" || indicator.type === "ema") {
        const series = chartRef.current.addSeries(LineSeries, {
          color: indicator.color || "#2563eb",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.setData(data.map((d: any) => ({ time: d.time as Time, value: d.value })));
        seriesArray.push(series);
      } else if (indicator.type === "bollinger") {
        // Upper band
        const upperSeries = chartRef.current.addSeries(LineSeries, {
          color: indicator.color || "#8b5cf6",
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        upperSeries.setData(data.upper.map((d: any) => ({ time: d.time as Time, value: d.value })));
        seriesArray.push(upperSeries);

        // Middle band
        const middleSeries = chartRef.current.addSeries(LineSeries, {
          color: indicator.color || "#8b5cf6",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        middleSeries.setData(data.middle.map((d: any) => ({ time: d.time as Time, value: d.value })));
        seriesArray.push(middleSeries);

        // Lower band
        const lowerSeries = chartRef.current.addSeries(LineSeries, {
          color: indicator.color || "#8b5cf6",
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        lowerSeries.setData(data.lower.map((d: any) => ({ time: d.time as Time, value: d.value })));
        seriesArray.push(lowerSeries);
      }

      if (seriesArray.length > 0) {
        indicatorSeriesRef.current.set(indicator.id, seriesArray);
      }
    }
  }, [settings.indicators, calculatedIndicators]);

  // Update trade markers
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

  // Get current or last candle for legend
  const displayCandle = crosshairData.candle || (processedCandles.length > 0 ? processedCandles[processedCandles.length - 1] : null);
  const displayPrevCandle = crosshairData.prevCandle || (processedCandles.length > 1 ? processedCandles[processedCandles.length - 2] : null);

  return (
    <div className="relative w-full h-full bg-card rounded-lg border overflow-hidden flex flex-col">
      {showToolbar && (
        <ChartToolbar
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}
      
      <div className="relative flex-1">
        <ChartLegend
          symbol={symbol}
          interval={interval}
          currentCandle={displayCandle}
          previousCandle={displayPrevCandle}
          indicators={settings.indicators}
          indicatorValues={indicatorValues}
        />
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
