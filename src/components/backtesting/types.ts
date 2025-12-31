export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
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
