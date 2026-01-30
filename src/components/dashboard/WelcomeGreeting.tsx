import { useMemo } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useTrades, TradeStats } from "@/hooks/useTrades";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format, isToday, startOfDay } from "date-fns";
import { he } from "date-fns/locale";

interface WelcomeGreetingProps {
  stats: TradeStats;
  trades: { entry_date: string | null; created_at: string; pnl: number | null }[];
}

export const WelcomeGreeting = ({ stats, trades }: WelcomeGreetingProps) => {
  const { profile } = useProfile();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "בוקר טוב";
    if (hour >= 12 && hour < 17) return "צהריים טובים";
    if (hour >= 17 && hour < 21) return "ערב טוב";
    return "לילה טוב";
  };

  const userName = profile?.first_name || profile?.username || "סוחר";

  // Calculate today's performance
  const todayStats = useMemo(() => {
    const today = startOfDay(new Date());
    const todayTrades = trades.filter(t => {
      const tradeDate = new Date(t.entry_date || t.created_at);
      return isToday(tradeDate);
    });
    
    const todayPnl = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const todayWins = todayTrades.filter(t => (t.pnl || 0) > 0).length;
    const todayLosses = todayTrades.filter(t => (t.pnl || 0) < 0).length;
    
    return {
      trades: todayTrades.length,
      pnl: todayPnl,
      wins: todayWins,
      losses: todayLosses,
    };
  }, [trades]);

  const getPerformanceEmoji = () => {
    if (todayStats.trades === 0) return "📊";
    if (todayStats.pnl > 0) return "🚀";
    if (todayStats.pnl < 0) return "💪";
    return "⚖️";
  };

  const getPerformanceMessage = () => {
    if (todayStats.trades === 0) {
      return "עדיין לא סחרת היום - בהצלחה!";
    }
    if (todayStats.pnl > 0) {
      return `יום מעולה! ${todayStats.wins} עסקאות מנצחות`;
    }
    if (todayStats.pnl < 0) {
      return `אל תוותר! עוד ${Math.abs(todayStats.pnl).toFixed(0)}$ עד לאיזון`;
    }
    return "יום מאוזן!";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 md:p-6 animate-fade-in">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-success/5 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
      
      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Greeting Section */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 md:p-3 rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-foreground">
              {getGreeting()}, {userName}! {getPerformanceEmoji()}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {format(new Date(), "EEEE, d בMMMM", { locale: he })}
            </p>
          </div>
        </div>

        {/* Today's Quick Stats */}
        <div className="flex items-center gap-3 md:gap-4 flex-wrap">
          {todayStats.trades > 0 ? (
            <>
              <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm rounded-xl px-3 py-2 border border-border/50">
                <span className="text-xs text-muted-foreground">היום:</span>
                <span className={`font-bold ${todayStats.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {todayStats.pnl >= 0 ? '+' : ''}${todayStats.pnl.toFixed(0)}
                </span>
                {todayStats.pnl > 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : todayStats.pnl < 0 ? (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                ) : (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-success/10 text-success px-2 py-1 rounded-lg">{todayStats.wins} ✓</span>
                <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-lg">{todayStats.losses} ✗</span>
              </div>
            </>
          ) : (
            <div className="bg-card/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-border/50">
              <p className="text-sm text-muted-foreground">{getPerformanceMessage()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
