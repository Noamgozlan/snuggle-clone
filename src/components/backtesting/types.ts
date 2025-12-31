export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface BacktestTrade {
  id: string;
  type: "buy" | "sell";
  entryPrice: number;
  entryTime: number;
  exitPrice?: number;
  exitTime?: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  pnl?: number;
  rr?: number;
  status: "open" | "closed";
  strategy?: string;
  notes?: string;
}

export type ChartType = "candles" | "line" | "area" | "heikinAshi";

export interface IndicatorConfig {
  id: string;
  type: "sma" | "ema" | "rsi" | "macd" | "bollinger";
  enabled: boolean;
  params: Record<string, number>;
  color?: string;
}

export interface ChartSettings {
  chartType: ChartType;
  indicators: IndicatorConfig[];
  showVolume: boolean;
  showGrid: boolean;
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  chartType: "candles",
  indicators: [],
  showVolume: true,
  showGrid: true,
};
