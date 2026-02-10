import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trade } from "@/hooks/useTrades";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, format } from "date-fns";
import { he } from "date-fns/locale";

interface PeriodComparisonProps {
  trades: Trade[];
}

type PeriodType = "week" | "month";

export const PeriodComparison = ({ trades }: PeriodComparisonProps) => {
  const [periodType, setPeriodType] = useState<PeriodType>("week");

  const comparison = useMemo(() => {
    const now = new Date();
    let currentStart: Date, currentEnd: Date, prevStart: Date, prevEnd: Date;

    if (periodType === "week") {
      currentStart = startOfWeek(now, { weekStartsOn: 0 });
      currentEnd = endOfWeek(now, { weekStartsOn: 0 });
      prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
      prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
    } else {
      currentStart = startOfMonth(now);
      currentEnd = endOfMonth(now);
      prevStart = startOfMonth(subMonths(now, 1));
      prevEnd = endOfMonth(subMonths(now, 1));
    }

    const filterTrades = (start: Date, end: Date) => trades.filter(t => {
      const d = new Date(t.entry_date || t.created_at);
      return d >= start && d <= end;
    });

    const calcMetrics = (periodTrades: Trade[]) => {
      const pnl = periodTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      const wins = periodTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0;
      const avgPnl = periodTrades.length > 0 ? pnl / periodTrades.length : 0;
      const grossWin = periodTrades.filter(t => (t.pnl || 0) > 0).reduce((s, t) => s + (t.pnl || 0), 0);
      const grossLoss = Math.abs(periodTrades.filter(t => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0));
      const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;
      return { pnl, count: periodTrades.length, winRate, avgPnl, profitFactor };
    };

    const current = calcMetrics(filterTrades(currentStart, currentEnd));
    const previous = calcMetrics(filterTrades(prevStart, prevEnd));

    const change = (curr: number, prev: number) => prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : curr > 0 ? 100 : 0;

    return {
      current, previous,
      currentLabel: format(currentStart, "dd/MM", { locale: he }) + " - " + format(currentEnd, "dd/MM", { locale: he }),
      previousLabel: format(prevStart, "dd/MM", { locale: he }) + " - " + format(prevEnd, "dd/MM", { locale: he }),
      changes: {
        pnl: change(current.pnl, previous.pnl),
        winRate: current.winRate - previous.winRate,
        count: change(current.count, previous.count),
        avgPnl: change(current.avgPnl, previous.avgPnl),
        profitFactor: change(current.profitFactor, previous.profitFactor),
      }
    };
  }, [trades, periodType]);

  const ChangeIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    if (Math.abs(value) < 0.1) return <Minus className="h-3 w-3 text-muted-foreground" />;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${value > 0 ? "text-success" : "text-destructive"}`}>
        {value > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {value > 0 ? "+" : ""}{value.toFixed(1)}{suffix}
      </span>
    );
  };

  const metrics = [
    { label: "PnL", current: `$${comparison.current.pnl.toFixed(0)}`, previous: `$${comparison.previous.pnl.toFixed(0)}`, change: comparison.changes.pnl },
    { label: "Win Rate", current: `${comparison.current.winRate.toFixed(1)}%`, previous: `${comparison.previous.winRate.toFixed(1)}%`, change: comparison.changes.winRate },
    { label: "עסקאות", current: String(comparison.current.count), previous: String(comparison.previous.count), change: comparison.changes.count },
    { label: "ממוצע לעסקה", current: `$${comparison.current.avgPnl.toFixed(0)}`, previous: `$${comparison.previous.avgPnl.toFixed(0)}`, change: comparison.changes.avgPnl },
    { label: "Profit Factor", current: comparison.current.profitFactor.toFixed(2), previous: comparison.previous.profitFactor.toFixed(2), change: comparison.changes.profitFactor },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={periodType === "week" ? "default" : "outline"} size="sm" onClick={() => setPeriodType("week")}>שבוע vs שבוע</Button>
        <Button variant={periodType === "month" ? "default" : "outline"} size="sm" onClick={() => setPeriodType("month")}>חודש vs חודש</Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {/* Headers */}
        <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground px-3">
          <span>מדד</span>
          <span className="text-center">{comparison.previousLabel}</span>
          <span className="text-center">{comparison.currentLabel}</span>
          <span className="text-center">שינוי</span>
        </div>

        {metrics.map(m => (
          <Card key={m.label} className="bg-card border-border p-3">
            <div className="grid grid-cols-4 gap-2 items-center">
              <span className="text-sm font-medium">{m.label}</span>
              <span className="text-sm text-center text-muted-foreground">{m.previous}</span>
              <span className="text-sm text-center font-semibold">{m.current}</span>
              <div className="flex justify-center"><ChangeIndicator value={m.change} /></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
