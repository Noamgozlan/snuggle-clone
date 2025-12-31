import type { CandleData } from "../types";

// Simple Moving Average
export function calculateSMA(data: CandleData[], period: number): { time: number; value: number }[] {
  const result: { time: number; value: number }[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({
      time: data[i].time,
      value: sum / period,
    });
  }
  
  return result;
}

// Exponential Moving Average
export function calculateEMA(data: CandleData[], period: number): { time: number; value: number }[] {
  if (data.length < period) return [];
  
  const result: { time: number; value: number }[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;
  result.push({ time: data[period - 1].time, value: ema });
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ time: data[i].time, value: ema });
  }
  
  return result;
}

// Bollinger Bands
export function calculateBollingerBands(
  data: CandleData[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: { time: number; value: number }[];
  middle: { time: number; value: number }[];
  lower: { time: number; value: number }[];
} {
  const result = {
    upper: [] as { time: number; value: number }[],
    middle: [] as { time: number; value: number }[],
    lower: [] as { time: number; value: number }[],
  };
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    const values: number[] = [];
    
    for (let j = 0; j < period; j++) {
      const close = data[i - j].close;
      sum += close;
      values.push(close);
    }
    
    const sma = sum / period;
    
    // Calculate standard deviation
    let squaredDiffSum = 0;
    for (const val of values) {
      squaredDiffSum += Math.pow(val - sma, 2);
    }
    const std = Math.sqrt(squaredDiffSum / period);
    
    result.middle.push({ time: data[i].time, value: sma });
    result.upper.push({ time: data[i].time, value: sma + stdDev * std });
    result.lower.push({ time: data[i].time, value: sma - stdDev * std });
  }
  
  return result;
}

// RSI
export function calculateRSI(data: CandleData[], period: number = 14): { time: number; value: number }[] {
  if (data.length < period + 1) return [];
  
  const result: { time: number; value: number }[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate initial gains and losses
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  let avgGain = gains.reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.reduce((a, b) => a + b, 0) / period;
  
  // First RSI value
  const firstRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push({ time: data[period].time, value: firstRsi });
  
  // Calculate remaining RSI values
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: data[i].time, value: rsi });
  }
  
  return result;
}

// MACD
export function calculateMACD(
  data: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: { time: number; value: number }[];
  signal: { time: number; value: number }[];
  histogram: { time: number; value: number; color: string }[];
} {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  
  // Calculate MACD line
  const macdLine: { time: number; value: number }[] = [];
  const slowStartIndex = slowPeriod - fastPeriod;
  
  for (let i = 0; i < slowEMA.length; i++) {
    const fastIndex = i + slowStartIndex;
    if (fastIndex >= 0 && fastIndex < fastEMA.length) {
      macdLine.push({
        time: slowEMA[i].time,
        value: fastEMA[fastIndex].value - slowEMA[i].value,
      });
    }
  }
  
  // Calculate signal line (EMA of MACD)
  if (macdLine.length < signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }
  
  const signalLine: { time: number; value: number }[] = [];
  const multiplier = 2 / (signalPeriod + 1);
  
  let sum = 0;
  for (let i = 0; i < signalPeriod; i++) {
    sum += macdLine[i].value;
  }
  let ema = sum / signalPeriod;
  signalLine.push({ time: macdLine[signalPeriod - 1].time, value: ema });
  
  for (let i = signalPeriod; i < macdLine.length; i++) {
    ema = (macdLine[i].value - ema) * multiplier + ema;
    signalLine.push({ time: macdLine[i].time, value: ema });
  }
  
  // Calculate histogram
  const histogram: { time: number; value: number; color: string }[] = [];
  const signalStartIndex = signalPeriod - 1;
  
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = i + signalStartIndex;
    if (macdIndex < macdLine.length) {
      const value = macdLine[macdIndex].value - signalLine[i].value;
      histogram.push({
        time: signalLine[i].time,
        value,
        color: value >= 0 ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
      });
    }
  }
  
  return {
    macd: macdLine.slice(signalStartIndex),
    signal: signalLine,
    histogram,
  };
}

// Convert candles to Heikin-Ashi
export function convertToHeikinAshi(data: CandleData[]): CandleData[] {
  if (data.length === 0) return [];
  
  const result: CandleData[] = [];
  
  // First candle
  const firstHA: CandleData = {
    time: data[0].time,
    open: (data[0].open + data[0].close) / 2,
    close: (data[0].open + data[0].high + data[0].low + data[0].close) / 4,
    high: data[0].high,
    low: data[0].low,
    volume: data[0].volume,
  };
  result.push(firstHA);
  
  // Remaining candles
  for (let i = 1; i < data.length; i++) {
    const prevHA = result[i - 1];
    const current = data[i];
    
    const haClose = (current.open + current.high + current.low + current.close) / 4;
    const haOpen = (prevHA.open + prevHA.close) / 2;
    
    result.push({
      time: current.time,
      open: haOpen,
      close: haClose,
      high: Math.max(current.high, haOpen, haClose),
      low: Math.min(current.low, haOpen, haClose),
      volume: current.volume,
    });
  }
  
  return result;
}
