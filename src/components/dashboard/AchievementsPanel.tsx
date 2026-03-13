import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Target, TrendingUp, Zap, Shield, Star, Award, Crown, Medal } from "lucide-react";
import { Trade } from "@/hooks/useTrades";
import { format, getDay } from "date-fns";

interface Achievement {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementsPanelProps {
  trades: Trade[];
}

export const AchievementsPanel = ({ trades }: AchievementsPanelProps) => {
  const achievements = useMemo<Achievement[]>(() => {
    const closedTrades = trades.filter(t => t.is_closed);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    
    // Calculate streaks
    const sorted = [...closedTrades].sort((a, b) => 
      new Date(a.entry_date || a.created_at).getTime() - new Date(b.entry_date || b.created_at).getTime()
    );
    
    let maxWinStreak = 0, tempWin = 0;
    sorted.forEach(t => {
      if ((t.pnl || 0) > 0) { tempWin++; maxWinStreak = Math.max(maxWinStreak, tempWin); }
      else { tempWin = 0; }
    });

    // Green days streak
    const dayPnl: Record<string, number> = {};
    closedTrades.filter(t => t.entry_date).forEach(t => {
      const d = format(new Date(t.entry_date!), "yyyy-MM-dd");
      dayPnl[d] = (dayPnl[d] || 0) + (t.pnl || 0);
    });
    const sortedDays = Object.entries(dayPnl).sort((a, b) => a[0].localeCompare(b[0]));
    let maxGreenDays = 0, tempGreen = 0;
    sortedDays.forEach(([, pnl]) => {
      if (pnl > 0) { tempGreen++; maxGreenDays = Math.max(maxGreenDays, tempGreen); }
      else { tempGreen = 0; }
    });

    // Unique symbols
    const uniqueSymbols = new Set(trades.map(t => t.symbol));

    // No-mistake trades
    const cleanTrades = closedTrades.filter(t => !t.mistakes || t.mistakes.length === 0);

    return [
      {
        id: "first_trade",
        icon: <Star className="h-5 w-5" />,
        title: "צעד ראשון",
        description: "ביצעת את העסקה הראשונה שלך",
        unlocked: closedTrades.length >= 1,
        progress: Math.min(closedTrades.length, 1),
        maxProgress: 1,
      },
      {
        id: "ten_trades",
        icon: <Target className="h-5 w-5" />,
        title: "מתחילים ברצינות",
        description: "השלמת 10 עסקאות",
        unlocked: closedTrades.length >= 10,
        progress: Math.min(closedTrades.length, 10),
        maxProgress: 10,
      },
      {
        id: "fifty_trades",
        icon: <Medal className="h-5 w-5" />,
        title: "סוחר מנוסה",
        description: "השלמת 50 עסקאות",
        unlocked: closedTrades.length >= 50,
        progress: Math.min(closedTrades.length, 50),
        maxProgress: 50,
      },
      {
        id: "hundred_trades",
        icon: <Crown className="h-5 w-5" />,
        title: "מאה ויותר!",
        description: "השלמת 100 עסקאות",
        unlocked: closedTrades.length >= 100,
        progress: Math.min(closedTrades.length, 100),
        maxProgress: 100,
      },
      {
        id: "win_streak_3",
        icon: <Flame className="h-5 w-5" />,
        title: "על גל",
        description: "רצף של 3 עסקאות רווחיות",
        unlocked: maxWinStreak >= 3,
        progress: Math.min(maxWinStreak, 3),
        maxProgress: 3,
      },
      {
        id: "win_streak_5",
        icon: <Zap className="h-5 w-5" />,
        title: "בלתי ניתן לעצירה",
        description: "רצף של 5 עסקאות רווחיות",
        unlocked: maxWinStreak >= 5,
        progress: Math.min(maxWinStreak, 5),
        maxProgress: 5,
      },
      {
        id: "win_streak_10",
        icon: <Crown className="h-5 w-5" />,
        title: "מלך הרצפים",
        description: "רצף של 10 עסקאות רווחיות",
        unlocked: maxWinStreak >= 10,
        progress: Math.min(maxWinStreak, 10),
        maxProgress: 10,
      },
      {
        id: "green_week",
        icon: <TrendingUp className="h-5 w-5" />,
        title: "שבוע ירוק",
        description: "5 ימי מסחר רווחיים ברצף",
        unlocked: maxGreenDays >= 5,
        progress: Math.min(maxGreenDays, 5),
        maxProgress: 5,
      },
      {
        id: "multi_asset",
        icon: <Award className="h-5 w-5" />,
        title: "מגוון נכסים",
        description: "סחרת ב-5 נכסים שונים",
        unlocked: uniqueSymbols.size >= 5,
        progress: Math.min(uniqueSymbols.size, 5),
        maxProgress: 5,
      },
      {
        id: "discipline_master",
        icon: <Shield className="h-5 w-5" />,
        title: "משמעת ברזל",
        description: "10 עסקאות ברצף ללא טעויות",
        unlocked: (() => {
          let streak = 0, maxClean = 0;
          sorted.forEach(t => {
            if (!t.mistakes || t.mistakes.length === 0) { streak++; maxClean = Math.max(maxClean, streak); }
            else { streak = 0; }
          });
          return maxClean >= 10;
        })(),
        progress: Math.min(cleanTrades.length, 10),
        maxProgress: 10,
      },
    ];
  }, [trades]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card className="bg-card border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          הישגים
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {unlockedCount}/{achievements.length} 🔓
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`relative rounded-lg p-3 text-center transition-all border ${
              achievement.unlocked
                ? "bg-primary/5 border-primary/20 shadow-sm"
                : "bg-muted/10 border-border/50 opacity-50 grayscale"
            }`}
          >
            <div className={`mx-auto mb-1.5 w-8 h-8 rounded-full flex items-center justify-center ${
              achievement.unlocked ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground"
            }`}>
              {achievement.icon}
            </div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">{achievement.title}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{achievement.description}</p>
            
            {/* Progress bar */}
            {achievement.maxProgress && (
              <div className="mt-1.5 w-full h-1 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((achievement.progress || 0) / achievement.maxProgress) * 100}%` }}
                />
              </div>
            )}
            
            {achievement.unlocked && (
              <div className="absolute -top-1 -end-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-[8px]">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};
