import { useMemo } from "react";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { Target, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { startOfMonth } from "date-fns";
import { Trade } from "@/hooks/useTrades";

interface ProfitGoalProgressProps {
  trades: Trade[];
}

export const ProfitGoalProgress = ({ trades }: ProfitGoalProgressProps) => {
  const { activePortfolio } = usePortfolio();

  const { currentMonthPnl, progressPercentage, goalAmount, isGoalReached, isOnTrack } = useMemo(() => {
    const profitGoal = activePortfolio?.profit_goal || 0;
    const drawdown = activePortfolio?.drawdown || 0;

    // Calculate current month PnL
    const monthStart = startOfMonth(new Date());
    const currentMonthTrades = trades.filter(t => {
      const date = new Date(t.entry_date || t.created_at);
      return date >= monthStart;
    });
    
    const monthPnl = currentMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    
    // Progress percentage
    const progress = profitGoal > 0 ? Math.min((monthPnl / profitGoal) * 100, 150) : 0;
    
    // Check if on track (based on day of month)
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const expectedProgress = (dayOfMonth / daysInMonth) * 100;
    const onTrack = progress >= expectedProgress * 0.8; // Allow 20% buffer

    return {
      currentMonthPnl: monthPnl,
      progressPercentage: progress,
      goalAmount: profitGoal,
      isGoalReached: monthPnl >= profitGoal && profitGoal > 0,
      isOnTrack: onTrack,
    };
  }, [trades, activePortfolio]);

  // Don't show if no goal is set
  if (!activePortfolio?.profit_goal || activePortfolio.profit_goal <= 0) {
    return null;
  }

  const remaining = goalAmount - currentMonthPnl;
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  return (
    <div 
      className="relative overflow-hidden rounded-xl bg-card/50 border border-border/50 p-4 animate-fade-in hover:border-primary/30 transition-all"
      style={{ animationDelay: "0.15s" }}
    >
      {/* Decorative gradient */}
      <div className={`absolute top-0 left-0 w-full h-1 ${isGoalReached ? 'bg-gradient-to-l from-success to-success/50' : 'bg-gradient-to-l from-primary to-primary/50'}`} />
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isGoalReached ? 'bg-success/10' : 'bg-primary/10'}`}>
            {isGoalReached ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <Target className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">יעד רווח חודשי</h3>
            <p className="text-xs text-muted-foreground">
              {isGoalReached ? "היעד הושג! 🎉" : `${daysRemaining} ימים נותרו`}
            </p>
          </div>
        </div>
        
        <div className="text-left">
          <p className={`text-lg font-bold ${currentMonthPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${currentMonthPnl.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">מתוך ${goalAmount.toFixed(0)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative">
          <Progress 
            value={Math.max(0, Math.min(progressPercentage, 100))} 
            className="h-3"
          />
          {/* Overage indicator */}
          {progressPercentage > 100 && (
            <div 
              className="absolute top-0 right-0 h-full bg-success/50 rounded-full"
              style={{ width: `${Math.min(progressPercentage - 100, 50)}%` }}
            />
          )}
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            {isGoalReached ? (
              <>
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">+${(currentMonthPnl - goalAmount).toFixed(0)} מעל היעד</span>
              </>
            ) : isOnTrack ? (
              <>
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-success">במסלול הנכון</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 text-warning" />
                <span className="text-warning">נדרש ${remaining.toFixed(0)} נוספים</span>
              </>
            )}
          </div>
          <span className="text-muted-foreground font-medium">
            {progressPercentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
