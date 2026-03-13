import { useMemo } from "react";
import { AlertTriangle, X, Brain, TrendingDown, Clock } from "lucide-react";
import { Trade } from "@/hooks/useTrades";
import { useState } from "react";
import { format, isToday, parseISO } from "date-fns";

interface TiltDetectionProps {
  trades: Trade[];
}

export const TiltDetection = ({ trades }: TiltDetectionProps) => {
  const [dismissed, setDismissed] = useState(false);

  const tiltAnalysis = useMemo(() => {
    if (trades.length === 0) return null;

    // Sort by most recent first
    const sorted = [...trades]
      .filter(t => t.entry_date && t.is_closed)
      .sort((a, b) => new Date(b.entry_date!).getTime() - new Date(a.entry_date!).getTime());

    if (sorted.length < 2) return null;

    // Check consecutive losses (most recent trades)
    let consecutiveLosses = 0;
    let totalLossAmount = 0;
    for (const trade of sorted) {
      if ((trade.pnl || 0) < 0) {
        consecutiveLosses++;
        totalLossAmount += Math.abs(trade.pnl || 0);
      } else break;
    }

    // Check today's performance
    const todayTrades = sorted.filter(t => {
      try {
        return isToday(new Date(t.entry_date!));
      } catch { return false; }
    });
    const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const todayLosses = todayTrades.filter(t => (t.pnl || 0) < 0).length;
    const todayTotalTrades = todayTrades.length;

    // Determine tilt level
    // Level 3 (critical): 5+ consecutive losses or 4+ losses today
    // Level 2 (warning): 3-4 consecutive losses or 3 losses today
    // Level 1 (caution): 2 consecutive losses and negative today
    let level = 0;
    let message = "";
    let tip = "";

    if (consecutiveLosses >= 5 || todayLosses >= 4) {
      level = 3;
      message = `🚨 ${consecutiveLosses} הפסדים ברצף! סה״כ הפסד: $${totalLossAmount.toFixed(0)}`;
      tip = "מומלץ מאוד לעצור את המסחר היום. קח הפסקה, תנשום, ותחזור מחר עם ראש נקי.";
    } else if (consecutiveLosses >= 3 || todayLosses >= 3) {
      level = 2;
      message = `⚠️ ${consecutiveLosses} הפסדים ברצף ($${totalLossAmount.toFixed(0)})`;
      tip = "שקול לעצור את המסחר. בדוק אם אתה סוחר מתוך תסכול או לפי התוכנית.";
    } else if (consecutiveLosses >= 2 && todayPnl < 0) {
      level = 1;
      message = `💡 ${consecutiveLosses} הפסדים ברצף. יום שלילי עד כה.`;
      tip = "היזהר מ-revenge trading. חזור לתוכנית המסחר שלך.";
    }

    if (level === 0) return null;

    return { level, message, tip, consecutiveLosses, totalLossAmount, todayPnl, todayTotalTrades, todayLosses };
  }, [trades]);

  if (!tiltAnalysis || dismissed) return null;

  const bgColor = tiltAnalysis.level === 3
    ? "bg-destructive/10 border-destructive/30"
    : tiltAnalysis.level === 2
    ? "bg-orange-500/10 border-orange-500/30"
    : "bg-yellow-500/10 border-yellow-500/30";

  const iconColor = tiltAnalysis.level === 3
    ? "text-destructive"
    : tiltAnalysis.level === 2
    ? "text-orange-500"
    : "text-yellow-500";

  return (
    <div className={`rounded-lg border p-4 ${bgColor} animate-in slide-in-from-top-2 duration-300`} dir="rtl">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${bgColor}`}>
          {tiltAnalysis.level === 3 ? (
            <AlertTriangle className={`h-5 w-5 ${iconColor} animate-pulse`} />
          ) : (
            <Brain className={`h-5 w-5 ${iconColor}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-bold ${iconColor}`}>
              {tiltAnalysis.level === 3 ? "⛔ זיהוי Tilt - עצור מסחר!" : tiltAnalysis.level === 2 ? "⚠️ אזהרת Tilt" : "💡 שים לב"}
            </h4>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <p className="text-sm text-foreground mt-1">{tiltAnalysis.message}</p>
          <p className="text-xs text-muted-foreground mt-1.5">{tiltAnalysis.tip}</p>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" />
              <span>הפסד: ${tiltAnalysis.totalLossAmount.toFixed(0)}</span>
            </div>
            {tiltAnalysis.todayTotalTrades > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>היום: {tiltAnalysis.todayTotalTrades} עסקאות ({tiltAnalysis.todayLosses} הפסדים)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
