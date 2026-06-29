import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Trade } from "@/hooks/useTrades";
import { getHours } from "date-fns";

interface HourOfDayStatsProps {
  trades: Trade[];
}

interface HourStat {
  hour: number;
  pnl: number;
  count: number;
  wins: number;
  winRate: number;
}

export const HourOfDayStats = ({ trades }: HourOfDayStatsProps) => {
  const { hours, bestHour, worstHour, maxAbs } = useMemo(() => {
    const map = new Map<number, HourStat>();
    trades
      .filter((t) => t.entry_date && t.pnl !== null)
      .forEach((t) => {
        const h = getHours(new Date(t.entry_date!));
        const cur = map.get(h) || { hour: h, pnl: 0, count: 0, wins: 0, winRate: 0 };
        cur.pnl += t.pnl || 0;
        cur.count++;
        if ((t.pnl || 0) > 0) cur.wins++;
        map.set(h, cur);
      });
    const hours = Array.from(map.values())
      .map((h) => ({ ...h, winRate: h.count > 0 ? (h.wins / h.count) * 100 : 0 }))
      .sort((a, b) => a.hour - b.hour);
    const sortedByPnl = [...hours].sort((a, b) => b.pnl - a.pnl);
    const bestHour = sortedByPnl[0];
    const worstHour = sortedByPnl[sortedByPnl.length - 1];
    const maxAbs = Math.max(...hours.map((h) => Math.abs(h.pnl)), 1);
    return { hours, bestHour, worstHour, maxAbs };
  }, [trades]);

  if (hours.length === 0) return null;

  return (
    <Card className="bg-card border-border p-4 md:p-5">
      <h3 className="text-sm md:text-base font-semibold text-foreground flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        ביצועים לפי שעה ביום
      </h3>

      {/* Best/Worst summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {bestHour && bestHour.pnl > 0 && (
          <div className="rounded-lg bg-success/10 border border-success/20 p-3">
            <p className="text-[10px] md:text-xs text-muted-foreground">השעה הרווחית ביותר</p>
            <p className="text-base md:text-lg font-bold text-success" dir="ltr">
              {String(bestHour.hour).padStart(2, "0")}:00
            </p>
            <p className="text-[10px] md:text-xs text-success">
              +${bestHour.pnl.toFixed(2)} · {bestHour.winRate.toFixed(0)}% הצלחה
            </p>
          </div>
        )}
        {worstHour && worstHour.pnl < 0 && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-[10px] md:text-xs text-muted-foreground">השעה הגרועה ביותר</p>
            <p className="text-base md:text-lg font-bold text-destructive" dir="ltr">
              {String(worstHour.hour).padStart(2, "0")}:00
            </p>
            <p className="text-[10px] md:text-xs text-destructive">
              ${worstHour.pnl.toFixed(2)} · {worstHour.winRate.toFixed(0)}% הצלחה
            </p>
          </div>
        )}
      </div>

      {/* Bars per hour */}
      <div className="space-y-1.5">
        {hours.map((h) => {
          const widthPct = (Math.abs(h.pnl) / maxAbs) * 100;
          const isPositive = h.pnl >= 0;
          return (
            <div key={h.hour} className="flex items-center gap-2 text-xs">
              <span className="w-12 text-muted-foreground shrink-0" dir="ltr">
                {String(h.hour).padStart(2, "0")}:00
              </span>
              <div className="flex-1 h-5 bg-muted/30 rounded-sm relative overflow-hidden">
                <div
                  className={`h-full ${isPositive ? "bg-success/70" : "bg-destructive/70"} transition-all`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span
                className={`w-16 text-end shrink-0 font-medium ${isPositive ? "text-success" : "text-destructive"}`}
                dir="ltr"
              >
                ${h.pnl.toFixed(0)}
              </span>
              <span className="w-20 text-end shrink-0 text-muted-foreground">
                {h.count} · {h.winRate.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] md:text-xs text-muted-foreground mt-3 text-center">
        מבוסס על שעת הכניסה של העסקה
      </p>
    </Card>
  );
};
