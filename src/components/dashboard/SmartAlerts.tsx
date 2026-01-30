import { useMemo } from "react";
import { AlertCircle, TrendingUp, TrendingDown, Flame, Target, Award, Zap, Clock, BarChart3 } from "lucide-react";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { TradeStats, Trade } from "@/hooks/useTrades";

interface SmartAlertsProps {
  stats: TradeStats;
  trades: Trade[];
}

interface Alert {
  id: string;
  type: "success" | "warning" | "info" | "achievement";
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const SmartAlerts = ({ stats, trades }: SmartAlertsProps) => {
  const alerts = useMemo(() => {
    const alertsList: Alert[] = [];

    // Calculate previous month stats for comparison
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const currentMonthTrades = trades.filter(t => {
      const date = new Date(t.entry_date || t.created_at);
      return date >= currentMonthStart;
    });

    const prevMonthTrades = trades.filter(t => {
      const date = new Date(t.entry_date || t.created_at);
      return date >= prevMonthStart && date <= prevMonthEnd;
    });

    const currentMonthPnl = currentMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const prevMonthPnl = prevMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const currentMonthWinRate = currentMonthTrades.length > 0 
      ? (currentMonthTrades.filter(t => (t.pnl || 0) > 0).length / currentMonthTrades.length) * 100 
      : 0;
    const prevMonthWinRate = prevMonthTrades.length > 0 
      ? (prevMonthTrades.filter(t => (t.pnl || 0) > 0).length / prevMonthTrades.length) * 100 
      : 0;

    // Win streak detection
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.entry_date || b.created_at).getTime() - new Date(a.entry_date || a.created_at).getTime()
    );
    
    let currentStreak = 0;
    let isWinning = true;
    for (const trade of sortedTrades) {
      if (trade.pnl === 0 || trade.pnl === null) continue;
      const isWin = (trade.pnl || 0) > 0;
      if (currentStreak === 0) {
        isWinning = isWin;
        currentStreak = 1;
      } else if ((isWinning && isWin) || (!isWinning && !isWin)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Alert: Win streak
    if (currentStreak >= 3 && isWinning) {
      alertsList.push({
        id: "win-streak",
        type: "success",
        icon: <Flame className="h-4 w-4" />,
        title: `רצף של ${currentStreak} זכיות! 🔥`,
        description: "אתה במומנטום מצוין - המשך לשמור על המשמעת",
      });
    }

    // Alert: Loss streak - be supportive
    if (currentStreak >= 3 && !isWinning) {
      alertsList.push({
        id: "loss-streak",
        type: "warning",
        icon: <AlertCircle className="h-4 w-4" />,
        title: `${currentStreak} הפסדים ברצף`,
        description: "אולי כדאי לקחת הפסקה קצרה ולחזור עם ראש נקי",
      });
    }

    // Alert: Improvement from last month
    if (prevMonthTrades.length > 0 && currentMonthPnl > prevMonthPnl && currentMonthPnl > 0) {
      const improvement = currentMonthPnl - prevMonthPnl;
      alertsList.push({
        id: "month-improvement",
        type: "success",
        icon: <TrendingUp className="h-4 w-4" />,
        title: `שיפור של $${improvement.toFixed(0)} מהחודש שעבר!`,
        description: `עברת מ-$${prevMonthPnl.toFixed(0)} ל-$${currentMonthPnl.toFixed(0)}`,
      });
    }

    // Alert: Win rate improvement
    if (prevMonthTrades.length > 5 && currentMonthTrades.length > 5 && currentMonthWinRate > prevMonthWinRate + 5) {
      alertsList.push({
        id: "winrate-improvement",
        type: "success",
        icon: <Target className="h-4 w-4" />,
        title: `אחוז ההצלחה עלה ב-${(currentMonthWinRate - prevMonthWinRate).toFixed(0)}%!`,
        description: `מ-${prevMonthWinRate.toFixed(0)}% ל-${currentMonthWinRate.toFixed(0)}%`,
      });
    }

    // Alert: High win rate milestone
    if (stats.winRate >= 70 && stats.totalTrades >= 10) {
      alertsList.push({
        id: "high-winrate",
        type: "achievement",
        icon: <Award className="h-4 w-4" />,
        title: "אחוז הצלחה יוצא דופן!",
        description: `${stats.winRate.toFixed(0)}% - ביצוע מרשים מאוד`,
      });
    }

    // Alert: Excellent RR
    if (stats.avgRR >= 2.5 && stats.totalTrades >= 10) {
      alertsList.push({
        id: "excellent-rr",
        type: "achievement",
        icon: <Zap className="h-4 w-4" />,
        title: "יחס סיכון-תגמול מצוין!",
        description: `RR ממוצע של ${stats.avgRR.toFixed(2)} - עבודה מקצועית`,
      });
    }

    // Alert: Consistent trading
    if (stats.totalTrades >= 20 && stats.profitFactor >= 1.5) {
      alertsList.push({
        id: "consistent",
        type: "info",
        icon: <BarChart3 className="h-4 w-4" />,
        title: "מסחר עקבי!",
        description: `Profit Factor של ${stats.profitFactor.toFixed(2)} מראה על עקביות`,
      });
    }

    // Alert: First profitable month
    if (currentMonthTrades.length >= 5 && currentMonthPnl > 0 && prevMonthPnl <= 0) {
      alertsList.push({
        id: "first-profit",
        type: "success",
        icon: <TrendingUp className="h-4 w-4" />,
        title: "חודש רווחי! 🎉",
        description: "המשך כך - אתה בכיוון הנכון",
      });
    }

    // If no specific alerts, show general stats
    if (alertsList.length === 0 && stats.totalTrades > 0) {
      alertsList.push({
        id: "general-stats",
        type: "info",
        icon: <BarChart3 className="h-4 w-4" />,
        title: `${stats.totalTrades} עסקאות נרשמו`,
        description: `ממוצע לעסקה: ${stats.avgPnl >= 0 ? '+' : ''}$${stats.avgPnl.toFixed(0)}`,
      });
    }

    return alertsList.slice(0, 3); // Show max 3 alerts
  }, [stats, trades]);

  if (alerts.length === 0) return null;

  const getAlertStyles = (type: Alert["type"]) => {
    switch (type) {
      case "success":
        return "bg-success/10 border-success/30 text-success";
      case "warning":
        return "bg-warning/10 border-warning/30 text-warning";
      case "achievement":
        return "bg-primary/10 border-primary/30 text-primary";
      default:
        return "bg-muted/50 border-border text-muted-foreground";
    }
  };

  return (
    <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
      {alerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all hover:scale-[1.02] ${getAlertStyles(alert.type)}`}
          style={{ animationDelay: `${0.1 + index * 0.05}s` }}
        >
          <div className="shrink-0">{alert.icon}</div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-medium truncate">{alert.title}</p>
            <p className="text-[10px] md:text-xs opacity-80 truncate hidden sm:block">{alert.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
