import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "./ProgressRing";
import { GoalSettingDialog } from "./GoalSettingDialog";
import { TradingGoal } from "@/hooks/useTradingGoals";
import { Trade } from "@/hooks/useTrades";
import { Plus, Trash2, Target } from "lucide-react";
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns";

interface GoalsTrackerProps {
  goals: TradingGoal[];
  trades: Trade[];
  onCreateGoal: (goalType: string, metric: string, targetValue: number) => Promise<{ success: boolean }>;
  onDeleteGoal: (id: string) => Promise<{ success: boolean }>;
}

export const GoalsTracker = ({ goals, trades, onCreateGoal, onDeleteGoal }: GoalsTrackerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const goalProgress = useMemo(() => {
    const now = new Date();
    return goals.map(goal => {
      let periodStart: Date, periodEnd: Date;
      switch (goal.goal_type) {
        case "daily": periodStart = startOfDay(now); periodEnd = endOfDay(now); break;
        case "weekly": periodStart = startOfWeek(now, { weekStartsOn: 0 }); periodEnd = endOfWeek(now, { weekStartsOn: 0 }); break;
        case "monthly": periodStart = startOfMonth(now); periodEnd = endOfMonth(now); break;
        default: periodStart = startOfDay(now); periodEnd = endOfDay(now);
      }

      const periodTrades = trades.filter(t => {
        const d = new Date(t.entry_date || t.created_at);
        return d >= periodStart && d <= periodEnd;
      });

      let current = 0;
      switch (goal.metric) {
        case "pnl": current = periodTrades.reduce((s, t) => s + (t.pnl || 0), 0); break;
        case "trades": current = periodTrades.length; break;
        case "winrate":
          const wins = periodTrades.filter(t => (t.pnl || 0) > 0).length;
          current = periodTrades.length > 0 ? (wins / periodTrades.length) * 100 : 0; break;
        case "points": current = periodTrades.reduce((s, t) => s + (t.pnl_points || 0), 0); break;
      }

      const percentage = goal.target_value > 0 ? Math.min((current / goal.target_value) * 100, 100) : 0;
      return { ...goal, current, percentage };
    });
  }, [goals, trades]);

  const typeLabel = { daily: "יומי", weekly: "שבועי", monthly: "חודשי" } as Record<string, string>;
  const metricLabel = { pnl: "$", trades: "עסקאות", winrate: "%", points: "נק׳" } as Record<string, string>;

  return (
    <>
      <Card className="bg-card border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> יעדים
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> הוסף
          </Button>
        </div>

        {goalProgress.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">אין יעדים פעילים. הגדר יעד חדש!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {goalProgress.map(g => (
              <div key={g.id} className="flex flex-col items-center gap-2 relative group">
                <button onClick={() => onDeleteGoal(g.id)} className="absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-destructive hover:bg-destructive/10 rounded">
                  <Trash2 className="h-3 w-3" />
                </button>
                <ProgressRing value={g.current} max={g.target_value} size={80} strokeWidth={6} showValue={false} />
                <div className="text-center">
                  <p className="text-sm font-bold">{g.percentage.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">{typeLabel[g.goal_type]} - {g.current.toFixed(g.metric === "trades" ? 0 : 1)}/{g.target_value}{metricLabel[g.metric]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <GoalSettingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={onCreateGoal} />
    </>
  );
};
