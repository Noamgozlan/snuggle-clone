import { useEffect, useRef } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from "lightweight-charts";
import { CandleData, BacktestTrade } from "./BacktestingWorkspace";

interface BacktestingChartProps {
  candles: CandleData[];
  trades: BacktestTrade[];
  symbol: string;
}

export const BacktestingChart = ({ candles, trades, symbol }: BacktestingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
      },
      timeScale: {
        borderColor: 'rgba(42, 46, 57, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      const chartData: CandlestickData<Time>[] = candles.map(c => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      
      seriesRef.current.setData(chartData);
      
      // Auto-scroll to the right
      if (chartRef.current) {
        chartRef.current.timeScale().scrollToRealTime();
      }
    }
  }, [candles]);

  // Add trade markers
  useEffect(() => {
    if (seriesRef.current && trades.length > 0) {
      const markers = trades.flatMap(trade => {
        const entryMarker = {
          time: trade.entryTime as Time,
          position: trade.type === 'buy' ? 'belowBar' as const : 'aboveBar' as const,
          color: trade.type === 'buy' ? '#22c55e' : '#ef4444',
          shape: trade.type === 'buy' ? 'arrowUp' as const : 'arrowDown' as const,
          text: trade.type === 'buy' ? 'BUY' : 'SELL',
        };

        if (trade.status === 'closed' && trade.exitTime) {
          const exitMarker = {
            time: trade.exitTime as Time,
            position: trade.type === 'buy' ? 'aboveBar' as const : 'belowBar' as const,
            color: (trade.pnl || 0) >= 0 ? '#22c55e' : '#ef4444',
            shape: 'circle' as const,
            text: 'EXIT',
          };
          return [entryMarker, exitMarker];
        }
        
        return [entryMarker];
      });

      seriesRef.current.setMarkers(markers);
    }
  }, [trades]);

  return (
    <div ref={chartContainerRef} className="w-full h-full" />
  );
};
