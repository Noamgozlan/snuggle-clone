import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/hooks/useTrades";
import { Trophy, TrendingUp, TrendingDown, Brain, AlertTriangle, Calendar } from "lucide-react";
import { startOfWeek, endOfWeek, format, getDay } from "date-fns";
import { he } from "date-fns/locale";

interface WeeklyReviewProps {
  trades: Trade[];
}

export const WeeklyReview = ({ trades }: WeeklyReviewProps) => {
  const review = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const weekTrades = trades.filter(t => {
      const d = new Date(t.entry_date || t.created_at);
      return d >= weekStart && d <= weekEnd;
    });

    if (weekTrades.length === 0) return null;

    const pnl = weekTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = weekTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = (wins / weekTrades.length) * 100;

    // Best mental state
    const mentalCounts: Record<string, { count: number; pnl: number }> = {};
    weekTrades.forEach(t => {
      const ms = (t as any).mental_state;
      if (!ms) return;
      if (!mentalCounts[ms]) mentalCounts[ms] = { count: 0, pnl: 0 };
      mentalCounts[ms].count++;
      mentalCounts[ms].pnl += t.pnl || 0;
    });
    const bestMental = Object.entries(mentalCounts).sort((a, b) => b[1].pnl - a[1].pnl)[0];

    // Most common mistake
    const mistakeCounts: Record<string, number> = {};
    weekTrades.forEach(t => {
      ((t as any).mistakes as string[] | null)?.forEach(m => { mistakeCounts[m] = (mistakeCounts[m] || 0) + 1; });
    });
    const topMistake = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1])[0];

    // Best day
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayPnl: Record<number, number> = {};
    weekTrades.forEach(t => {
      const day = getDay(new Date(t.entry_date || t.created_at));
      dayPnl[day] = (dayPnl[day] || 0) + (t.pnl || 0);
    });
    const bestDayEntry = Object.entries(dayPnl).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    const bestDay = bestDayEntry ? dayNames[Number(bestDayEntry[0])] : null;

    // Grade
    let grade: string;
    if (winRate >= 70 && pnl > 0) grade = "A";
    else if (winRate >= 55 && pnl > 0) grade = "B";
    else if (winRate >= 45 && pnl >= 0) grade = "C";
    else if (pnl >= 0) grade = "D";
    else grade = "F";

    const gradeColor = { A: "text-success", B: "text-emerald-400", C: "text-yellow-400", D: "text-orange-400", F: "text-destructive" }[grade];

    return { pnl, winRate, wins, total: weekTrades.length, bestMental, topMistake, bestDay, grade, gradeColor, weekStart, weekEnd };
  }, [trades]);

  if (!review) return null;

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" /> סיכום שבועי
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {format(review.weekStart, "dd/MM", { locale: he })} - {format(review.weekEnd, "dd/MM", { locale: he })}
          </span>
          <span className={`text-2xl font-black ${review.gradeColor}`}>{review.grade}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">PnL שבועי</p>
          <p className={`text-lg font-bold ${review.pnl >= 0 ? "text-success" : "text-destructive"}`}>
            {review.pnl >= 0 ? "+" : ""}${review.pnl.toFixed(0)}
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Win Rate</p>
          <p className="text-lg font-bold text-foreground">{review.winRate.toFixed(0)}%</p>
          <p className="text-[10px] text-muted-foreground">{review.wins}/{review.total}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Brain className="h-3 w-3" /> מנטלי מוצלח</p>
          <p className="text-sm font-semibold text-foreground truncate">{review.bestMental ? review.bestMental[0] : "—"}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Calendar className="h-3 w-3" /> יום מוצלח</p>
          <p className="text-sm font-semibold text-foreground">{review.bestDay || "—"}</p>
        </div>
      </div>

      {review.topMistake && (
        <div className="mt-3 flex items-center gap-2 text-sm bg-destructive/10 rounded-lg p-2">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span className="text-muted-foreground">טעות נפוצה:</span>
          <span className="font-medium text-foreground">{review.topMistake[0]} ({review.topMistake[1]}x)</span>
        </div>
      )}
    </Card>
  );
};
