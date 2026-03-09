import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getMentalStateInfo, MENTAL_STATES } from "@/components/trades/TradeTagsSection";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { TradingScore } from "@/components/dashboard/TradingScore";
import { ShareStatsDialog } from "@/components/dashboard/ShareStatsDialog";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { GoalsTracker } from "@/components/dashboard/GoalsTracker";
import { WeeklyReview } from "@/components/dashboard/WeeklyReview";
import { RecurringMistakesBanner } from "@/components/dashboard/RecurringMistakesBanner";
import { PerformanceGauges, MiniGauge } from "@/components/dashboard/PerformanceGauges";

import { AddTradeDialog } from "@/components/trades/AddTradeDialog";
import { useTrades } from "@/hooks/useTrades";
import { useTradingGoals } from "@/hooks/useTradingGoals";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Plus, 
  Activity,
  Zap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Trophy,
  Skull,
  Share2,
  Calendar,
  ChevronUp,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, AreaChart, Area, Cell, PieChart, Pie } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, getDay } from "date-fns";
import { he } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { usePortfolio } from "@/contexts/PortfolioContext";

type DisplayMode = "money" | "points" | "percentage" | "balance";
type MonthlyViewMode = "pnl" | "trades" | "winrate" | "points";
type DateRange = { from: Date | undefined; to: Date | undefined };

const Dashboard = () => {
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("money");
  const [monthlyViewMode, setMonthlyViewMode] = useState<MonthlyViewMode>("pnl");
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const { trades: allTrades, stats: allStats, fetchTrades } = useTrades();
  const { user } = useAuth();
  const { activePortfolio } = usePortfolio();
  const { goals, createGoal, deleteGoal } = useTradingGoals();

  // Filter trades by date range
  const trades = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return allTrades;
    
    return allTrades.filter(trade => {
      const tradeDate = new Date(trade.entry_date || trade.created_at);
      if (dateRange.from && tradeDate < dateRange.from) return false;
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (tradeDate > endOfDay) return false;
      }
      return true;
    });
  }, [allTrades, dateRange]);

  // Recalculate stats for filtered trades
  const stats = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return allStats;
    
    const closedTrades = trades.filter(t => t.is_closed);
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalPoints = closedTrades.reduce((sum, t) => sum + (t.pnl_points || 0), 0);
    const winningTradesArr = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTradesArr = closedTrades.filter(t => (t.pnl || 0) < 0);
    const winningTrades = winningTradesArr.length;
    const losingTrades = losingTradesArr.length;
    const breakevenTrades = closedTrades.filter(t => t.pnl === 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
    const avgPnl = closedTrades.length > 0 ? totalPnl / closedTrades.length : 0;
    const avgPoints = closedTrades.length > 0 ? totalPoints / closedTrades.length : 0;
    const tradesWithRR = closedTrades.filter(t => t.rr !== null && t.rr !== undefined);
    const avgRR = tradesWithRR.length > 0 ? tradesWithRR.reduce((sum, t) => sum + (t.rr || 0), 0) / tradesWithRR.length : 0;
    const maxWin = Math.max(...closedTrades.map(t => t.pnl || 0), 0);
    const maxLoss = Math.min(...closedTrades.map(t => t.pnl || 0), 0);
    const maxWinPoints = Math.max(...closedTrades.map(t => t.pnl_points || 0), 0);
    const maxLossPoints = Math.min(...closedTrades.map(t => t.pnl_points || 0), 0);
    const grossProfit = winningTradesArr.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTradesArr.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? -grossLoss / losingTrades : 0;
    
    return {
      totalPnl,
      totalPoints,
      winningTrades,
      losingTrades,
      breakevenTrades,
      winRate,
      avgPnl,
      avgPoints,
      avgRR,
      totalTrades: trades.length,
      maxWin,
      maxLoss,
      maxWinPoints,
      maxLossPoints,
      profitFactor,
      avgWin,
      avgLoss,
    };
  }, [trades, allStats, dateRange]);

  const recentTrades = trades.slice(0, 5);
  const portfolioBalance = activePortfolio?.balance || 0;

  // Weekly data
  const weeklyData = useMemo(() => {
    const days = ["ש׳", "ו׳", "ה׳", "ד׳", "ג׳", "ב׳", "א׳"];
    const dayIndexes = [6, 5, 4, 3, 2, 1, 0];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    return days.map((day, i) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + dayIndexes[i]);
      const dateStr = format(dayDate, "yyyy-MM-dd");
      
      const dayTrades = trades.filter(t => {
        const tradeDate = t.entry_date ? format(new Date(t.entry_date), "yyyy-MM-dd") : format(new Date(t.created_at), "yyyy-MM-dd");
        return tradeDate === dateStr;
      });
      
      const pnlValue = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const pointsValue = dayTrades.reduce((sum, t) => sum + (t.pnl_points || 0), 0);
      
      let value: number;
      switch (displayMode) {
        case "points": value = pointsValue; break;
        case "percentage": value = portfolioBalance > 0 ? (pnlValue / portfolioBalance) * 100 : 0; break;
        default: value = pnlValue; break;
      }
      
      return { day, value, pnl: pnlValue, points: pointsValue, trades: dayTrades.length };
    });
  }, [trades, displayMode, portfolioBalance]);

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthTrades = trades.filter(t => {
        const tradeDate = new Date(t.entry_date || t.created_at);
        return tradeDate >= monthStart && tradeDate <= monthEnd;
      });
      
      const pnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const points = monthTrades.reduce((sum, t) => sum + (t.pnl_points || 0), 0);
      const winningTrades = monthTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = monthTrades.length > 0 ? (winningTrades / monthTrades.length) * 100 : 0;
      
      months.push({
        month: format(monthDate, "MMM", { locale: he }),
        pnl, points,
        trades: monthTrades.length,
        winRate,
        highlight: i === 0 && monthTrades.length > 0,
      });
    }
    
    return months.reverse();
  }, [trades]);

  // Streaks
  const tradingStreaks = useMemo(() => {
    if (trades.length === 0) return { currentStreak: 0, isWinning: true, maxWinStreak: 0, maxLoseStreak: 0, bestTrade: null, worstTrade: null };
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.entry_date || b.created_at).getTime() - new Date(a.entry_date || a.created_at).getTime()
    );
    
    let currentStreak = 0;
    let isWinning = (sortedTrades[0]?.pnl || 0) > 0;
    for (const trade of sortedTrades) {
      const isWin = (trade.pnl || 0) > 0;
      const isLoss = (trade.pnl || 0) < 0;
      if (trade.pnl === 0) continue;
      if ((isWinning && isWin) || (!isWinning && isLoss)) {
        currentStreak++;
      } else break;
    }
    
    let maxWinStreak = 0, maxLoseStreak = 0, tempWin = 0, tempLose = 0;
    for (const trade of sortedTrades) {
      if ((trade.pnl || 0) > 0) { tempWin++; tempLose = 0; maxWinStreak = Math.max(maxWinStreak, tempWin); }
      else if ((trade.pnl || 0) < 0) { tempLose++; tempWin = 0; maxLoseStreak = Math.max(maxLoseStreak, tempLose); }
    }
    
    const bestTrade = trades.reduce((best, t) => (t.pnl || 0) > (best?.pnl || -Infinity) ? t : best, trades[0]);
    const worstTrade = trades.reduce((worst, t) => (t.pnl || 0) < (worst?.pnl || Infinity) ? t : worst, trades[0]);
    
    return { currentStreak, isWinning, maxWinStreak, maxLoseStreak, bestTrade, worstTrade };
  }, [trades]);

  // Cumulative PNL
  const cumulativePnlData = useMemo(() => {
    const sortedTrades = trades
      .filter(t => t.entry_date && t.pnl !== null)
      .sort((a, b) => new Date(a.entry_date!).getTime() - new Date(b.entry_date!).getTime());
    
    let cumulative = 0;
    return sortedTrades.map((trade, index) => {
      cumulative += trade.pnl || 0;
      return {
        index: index + 1,
        date: format(new Date(trade.entry_date!), "dd/MM", { locale: he }),
        fullDate: format(new Date(trade.entry_date!), "dd/MM/yyyy", { locale: he }),
        pnl: trade.pnl || 0, cumulative, symbol: trade.symbol,
      };
    });
  }, [trades]);

  // Day of week performance
  const dayOfWeekPerformance = useMemo(() => {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayData: { [day: number]: { totalPnl: number; count: number; wins: number; losses: number } } = {};
    
    trades.filter(t => t.entry_date && t.pnl !== null).forEach(trade => {
      const day = getDay(new Date(trade.entry_date!));
      const pnl = trade.pnl || 0;
      if (!dayData[day]) dayData[day] = { totalPnl: 0, count: 0, wins: 0, losses: 0 };
      dayData[day].totalPnl += pnl;
      dayData[day].count += 1;
      if (pnl > 0) dayData[day].wins += 1;
      if (pnl < 0) dayData[day].losses += 1;
    });
    
    return Array.from({ length: 7 }, (_, i) => {
      const data = dayData[i] || { totalPnl: 0, count: 0, wins: 0, losses: 0 };
      return {
        day: i, dayName: dayNames[i], pnl: data.totalPnl, count: data.count,
        wins: data.wins, losses: data.losses,
        winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
        avgPnl: data.count > 0 ? data.totalPnl / data.count : 0,
      };
    }).filter(d => d.count > 0);
  }, [trades]);

  // Day win/loss stats for gauges
  const dayStats = useMemo(() => {
    const dayPnl: Record<string, number> = {};
    trades.filter(t => t.entry_date && t.pnl !== null).forEach(trade => {
      const dateKey = format(new Date(trade.entry_date!), "yyyy-MM-dd");
      dayPnl[dateKey] = (dayPnl[dateKey] || 0) + (trade.pnl || 0);
    });
    const days = Object.values(dayPnl);
    return {
      winningDays: days.filter(p => p > 0).length,
      losingDays: days.filter(p => p < 0).length,
      breakevenDays: days.filter(p => p === 0).length,
      dayWinPercent: days.length > 0 ? (days.filter(p => p > 0).length / days.length) * 100 : 0,
    };
  }, [trades]);

  const percentageDisplay = portfolioBalance > 0 ? (stats.totalPnl / portfolioBalance) * 100 : 0;
  const balanceWithPnl = portfolioBalance + stats.totalPnl;

  // Mental State distribution
  const mentalStateData = useMemo(() => {
    const counts: Record<string, { count: number; totalPnl: number; wins: number }> = {};
    trades.forEach(t => {
      const ms = (t as any).mental_state;
      if (!ms) return;
      if (!counts[ms]) counts[ms] = { count: 0, totalPnl: 0, wins: 0 };
      counts[ms].count++;
      counts[ms].totalPnl += t.pnl || 0;
      if ((t.pnl || 0) > 0) counts[ms].wins++;
    });
    const colors = ['hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(346, 77%, 40%)', 'hsl(174, 72%, 56%)', 'hsl(24, 95%, 53%)', 'hsl(48, 96%, 53%)', 'hsl(239, 84%, 67%)', 'hsl(271, 81%, 56%)'];
    return Object.entries(counts).map(([key, val], i) => {
      const info = getMentalStateInfo(key);
      return {
        name: info?.label || key,
        value: val.count,
        pnl: val.totalPnl,
        winRate: val.count > 0 ? Math.round((val.wins / val.count) * 100) : 0,
        fill: colors[i % colors.length],
      };
    }).sort((a, b) => b.value - a.value);
  }, [trades]);

  // Top Mistakes
  const mistakesData = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach(t => {
      const mistakes = (t as any).mistakes as string[] | null;
      if (!mistakes) return;
      mistakes.forEach(m => { counts[m] = (counts[m] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [trades]);

  const totalDisplay = displayMode === "money" ? stats.totalPnl : displayMode === "points" ? stats.totalPoints : displayMode === "percentage" ? percentageDisplay : balanceWithPnl;
  const avgDisplay = displayMode === "money" || displayMode === "balance" ? stats.avgPnl : displayMode === "points" ? stats.avgPoints : portfolioBalance > 0 ? (stats.avgPnl / portfolioBalance) * 100 : 0;

  const displayModes = [
    { key: "money" as const, label: "כסף", icon: "$" },
    { key: "points" as const, label: "נקודות", icon: "P" },
    { key: "percentage" as const, label: "אחוזים", icon: "%" },
    { key: "balance" as const, label: "מצב תיק", icon: "B" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-5 max-w-full overflow-x-hidden">
        {/* Recurring Mistakes Banner */}
        <RecurringMistakesBanner trades={trades} />
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mt-4 md:mt-0">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-foreground tracking-tight">
              דשבורד
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">ניתוח ביצועים</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <div className="flex bg-muted/30 rounded-md p-0.5 border border-border">
              {displayModes.map((mode) => (
                <button
                  key={mode.key}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all ${
                    displayMode === mode.key 
                      ? "bg-card text-foreground shadow-sm border border-border" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setDisplayMode(mode.key)}
                >
                  <span className="hidden sm:inline">{mode.label}</span>
                  <span className="sm:hidden">{mode.icon}</span>
                </button>
              ))}
            </div>
            <Button 
              variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setIsShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button 
              size="sm"
              className="gap-1.5 h-7 text-xs"
              onClick={() => setIsAddTradeOpen(true)}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">הוסף עסקה</span>
              <span className="sm:hidden">הוסף</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid - TradeZella Style */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Net P&L */}
          <Card className="bg-card border-border p-4 hover:border-primary/15 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Net P&L</span>
                <UITooltip>
                  <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">רווח/הפסד נקי מצטבר</TooltipContent>
                </UITooltip>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">{stats.totalTrades}</span>
              </div>
            </div>
            <p className={`text-2xl font-bold tabular-nums tracking-tight ${
              totalDisplay >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {displayMode === "balance" 
                ? `$${balanceWithPnl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                : displayMode === "money" ? `$${Math.abs(totalDisplay).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` 
                : displayMode === "points" ? totalDisplay.toFixed(1) : `${totalDisplay.toFixed(2)}%`}
            </p>
          </Card>

          {/* Trade Win % */}
          <Card className="bg-card border-border p-4 hover:border-primary/15 transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Trade win %</span>
              <UITooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                <TooltipContent side="top" className="text-xs">אחוז עסקאות מנצחות</TooltipContent>
              </UITooltip>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{stats.winRate.toFixed(2)}%</p>
              <MiniGauge wins={stats.winningTrades} breakeven={stats.breakevenTrades} losses={stats.losingTrades} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">{stats.winningTrades}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">{stats.breakevenTrades}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/15 text-destructive">{stats.losingTrades}</span>
            </div>
          </Card>

          {/* Profit Factor */}
          <Card className="bg-card border-border p-4 hover:border-primary/15 transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Profit factor</span>
              <UITooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                <TooltipContent side="top" className="text-xs">יחס רווח גולמי להפסד גולמי</TooltipContent>
              </UITooltip>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </p>
          </Card>

          {/* Day Win % */}
          <Card className="bg-card border-border p-4 hover:border-primary/15 transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Day win %</span>
              <UITooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                <TooltipContent side="top" className="text-xs">אחוז ימי מסחר רווחיים</TooltipContent>
              </UITooltip>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{dayStats.dayWinPercent.toFixed(2)}%</p>
              <MiniGauge wins={dayStats.winningDays} breakeven={dayStats.breakevenDays} losses={dayStats.losingDays} />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/15 text-success">{dayStats.winningDays}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/15 text-primary">{dayStats.breakevenDays}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/15 text-destructive">{dayStats.losingDays}</span>
            </div>
          </Card>

          {/* Avg Win/Loss Trade */}
          <Card className="bg-card border-border p-4 hover:border-primary/15 transition-all duration-200">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-medium text-muted-foreground">Avg win/loss trade</span>
              <UITooltip>
                <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50" /></TooltipTrigger>
                <TooltipContent side="top" className="text-xs">יחס ממוצע רווח לממוצע הפסד</TooltipContent>
              </UITooltip>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight mb-2">
              {stats.avgLoss !== 0 ? Math.abs(stats.avgWin / stats.avgLoss).toFixed(2) : '—'}
            </p>
            {/* Win/Loss bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-muted">
              <div
                className="h-full rounded-r-full transition-all"
                style={{ 
                  width: `${stats.avgWin + Math.abs(stats.avgLoss) > 0 ? (stats.avgWin / (stats.avgWin + Math.abs(stats.avgLoss))) * 100 : 50}%`, 
                  backgroundColor: 'hsl(var(--success))' 
                }}
              />
              <div
                className="h-full rounded-l-full transition-all"
                style={{ 
                  width: `${stats.avgWin + Math.abs(stats.avgLoss) > 0 ? (Math.abs(stats.avgLoss) / (stats.avgWin + Math.abs(stats.avgLoss))) * 100 : 50}%`, 
                  backgroundColor: 'hsl(var(--destructive))' 
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] font-semibold text-success tabular-nums">
                ${stats.avgWin.toFixed(0)}
              </span>
              <span className="text-[10px] font-semibold text-destructive tabular-nums">
                -${Math.abs(stats.avgLoss).toFixed(0)}
              </span>
            </div>
          </Card>
        </div>


        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <TradingCalendar trades={trades} displayMode={displayMode} portfolioBalance={portfolioBalance} />

            {/* Streaks & Records */}
            <Card className="bg-card border-border p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Flame className="h-4 w-4 text-primary" />
                רצפים ושיאים
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-lg p-3.5 border ${tradingStreaks.isWinning ? 'bg-success/5 border-success/20' : 'bg-destructive/5 border-destructive/20'}`}>
                  <span className="text-xs text-muted-foreground block mb-1">רצף נוכחי</span>
                  <p className={`text-xl font-bold ${tradingStreaks.isWinning ? 'text-success' : 'text-destructive'}`}>
                    {tradingStreaks.currentStreak}
                  </p>
                  <span className={`text-xs ${tradingStreaks.isWinning ? 'text-success/70' : 'text-destructive/70'}`}>
                    {tradingStreaks.isWinning ? 'זכיות ברצף' : 'הפסדים ברצף'}
                  </span>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3.5 border border-border/50">
                  <span className="text-xs text-muted-foreground block mb-1">שיאי רצפים</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <div>
                      <span className="text-xl font-bold text-success">{tradingStreaks.maxWinStreak}</span>
                      <span className="text-xs text-muted-foreground mr-1">W</span>
                    </div>
                    <div>
                      <span className="text-xl font-bold text-destructive">{tradingStreaks.maxLoseStreak}</span>
                      <span className="text-xs text-muted-foreground mr-1">L</span>
                    </div>
                  </div>
                </div>
                
                {tradingStreaks.bestTrade && (
                  <div className="bg-success/5 rounded-lg p-3.5 border border-success/15">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Trophy className="h-3.5 w-3.5 text-success" />
                      <span className="text-xs text-muted-foreground">עסקה הכי טובה</span>
                    </div>
                    <p className="text-lg font-bold text-success">
                      {displayMode === "points" ? `+${(tradingStreaks.bestTrade.pnl_points || 0).toFixed(0)}` : `+$${(tradingStreaks.bestTrade.pnl || 0).toFixed(0)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{tradingStreaks.bestTrade.symbol}</p>
                  </div>
                )}
                
                {tradingStreaks.worstTrade && (
                  <div className="bg-destructive/5 rounded-lg p-3.5 border border-destructive/15">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Skull className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs text-muted-foreground">עסקה הכי גרועה</span>
                    </div>
                    <p className="text-lg font-bold text-destructive">
                      {displayMode === "points" ? `${(tradingStreaks.worstTrade.pnl_points || 0).toFixed(0)}` : `$${(tradingStreaks.worstTrade.pnl || 0).toFixed(0)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{tradingStreaks.worstTrade.symbol}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-4">
            <TradingScore 
              winRate={stats.winRate}
              avgRR={stats.avgRR}
              avgWinLossRatio={stats.avgWin > 0 && stats.avgLoss !== 0 ? Math.abs(stats.avgWin / stats.avgLoss) : 0}
              profitFactor={stats.profitFactor === Infinity ? 3 : stats.profitFactor}
              consistency={dayStats.dayWinPercent}
            />

            {/* Weekly Performance */}
            <Card className="bg-card border-border p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-primary" />
                ביצועים שבועיים
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => {
                        switch (displayMode) {
                          case "points": return [`${value.toFixed(1)} נק׳`, ""];
                          case "percentage": return [`${value.toFixed(2)}%`, ""];
                          default: return [`$${value.toFixed(2)}`, ""];
                        }
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={index} fill={entry.value >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} opacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent Trades */}
            <Card className="bg-card border-border p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                עסקאות אחרונות
              </h3>
              <div className="space-y-1">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">אין עסקאות להצגה</p>
                    <Button variant="link" className="text-primary mt-1 text-sm" onClick={() => setIsAddTradeOpen(true)}>
                      הוסף עסקה ראשונה
                    </Button>
                  </div>
                ) : (
                  recentTrades.map((trade) => {
                    const moneyValue = trade.pnl || 0;
                    const pointsValue = trade.pnl_points || 0;
                    const isProfit = moneyValue >= 0;
                    
                    const getDisplayValue = () => {
                      switch (displayMode) {
                        case "points": return `${isProfit ? '+' : ''}${pointsValue.toFixed(1)}`;
                        case "percentage":
                          const pct = portfolioBalance > 0 ? (moneyValue / portfolioBalance) * 100 : 0;
                          return `${isProfit ? '+' : ''}${pct.toFixed(2)}%`;
                        default: return `${isProfit ? '+' : ''}$${moneyValue.toFixed(2)}`;
                      }
                    };
                    
                    return (
                      <div key={trade.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-1 h-8 rounded-full ${isProfit ? 'bg-success' : 'bg-destructive'}`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{trade.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {trade.entry_date ? new Date(trade.entry_date).toLocaleDateString('he-IL') : new Date(trade.created_at).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${isProfit ? 'text-success' : 'text-destructive'}`}>
                          {getDisplayValue()}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Day of Week Performance */}
          <Card className="bg-card border-border p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              ביצועים לפי יום
            </h3>
            {dayOfWeekPerformance.length === 0 ? (
              <div className="h-48 md:h-56 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">אין מספיק נתונים</p>
              </div>
            ) : (
              <div className="h-48 md:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayOfWeekPerformance} margin={{ top: 5, right: 5, bottom: 15, left: 35 }}>
                    <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
                              <p className="font-semibold text-sm mb-1">יום {data.dayName}</p>
                              <p className={`font-bold ${data.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>${data.pnl.toFixed(2)}</p>
                              <p className="text-muted-foreground">{data.count} עסקאות · {data.winRate}% הצלחה</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {dayOfWeekPerformance.map((entry, index) => (
                        <Cell key={index} fill={entry.pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Cumulative PNL */}
          <Card className="bg-card border-border p-4 md:p-5">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" />
              עקומת הון
            </h3>
            {cumulativePnlData.length === 0 ? (
              <div className="h-48 md:h-56 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">אין מספיק נתונים</p>
              </div>
            ) : (
              <div className="h-48 md:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativePnlData} margin={{ top: 5, right: 5, bottom: 15, left: 35 }}>
                    <defs>
                      <linearGradient id="colorCumulativePnl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
                              <p className="font-semibold text-sm">{data.symbol}</p>
                              <p className="text-muted-foreground">{data.fullDate}</p>
                              <p className={`${data.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>עסקה: ${data.pnl.toFixed(2)}</p>
                              <p className={`font-bold ${data.cumulative >= 0 ? 'text-success' : 'text-destructive'}`}>סה"כ: ${data.cumulative.toFixed(2)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={1.5} fill="url(#colorCumulativePnl)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Tags Analytics */}
        {(mentalStateData.length > 0 || mistakesData.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Mental State Distribution */}
            {mentalStateData.length > 0 && (
              <Card className="bg-card border-border p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  🧠 Mental State
                </h3>
                <div className="flex items-center gap-4">
                  <div className="h-44 w-44 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mentalStateData}
                          cx="50%" cy="50%"
                          innerRadius={35} outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {mentalStateData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload?.[0]) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
                                  <p className="font-semibold text-sm">{d.name}</p>
                                  <p className="text-muted-foreground">{d.value} עסקאות · {d.winRate}% הצלחה</p>
                                  <p className={d.pnl >= 0 ? 'text-success' : 'text-destructive'}>${d.pnl.toFixed(0)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {mentalStateData.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">{item.winRate}% win</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Top Mistakes */}
            {mistakesData.length > 0 && (
              <Card className="bg-card border-border p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  ⚠️ Top Mistakes
                </h3>
                <div className="h-48 md:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mistakesData} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 80 }}>
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} width={75} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        formatter={(value: number) => [`${value} פעמים`, '']}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="hsl(24, 95%, 53%)" opacity={0.75} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Monthly Breakdown */}
        <Card className="bg-card border-border p-4 md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
            <h3 className="text-sm font-semibold text-foreground">פירוט חודשי</h3>
            <div className="flex bg-muted/50 rounded-lg p-0.5 border border-border/50 mr-auto sm:mr-0">
              {[
                { key: "pnl", label: "רווח/הפסד", short: "$" },
                { key: "trades", label: "עסקאות", short: "#" },
                { key: "winrate", label: "הצלחה", short: "%" },
                { key: "points", label: "נקודות", short: "P" },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    monthlyViewMode === item.key 
                      ? "bg-card text-foreground shadow-sm border border-border/50" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setMonthlyViewMode(item.key as MonthlyViewMode)}
                >
                  <span className="hidden md:inline">{item.label}</span>
                  <span className="md:hidden">{item.short}</span>
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground mr-auto font-medium">2025</span>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {monthlyBreakdown.map((month, index) => {
              let displayValue: string;
              let isPositive = true;
              
              switch (monthlyViewMode) {
                case "pnl": displayValue = `$${month.pnl.toFixed(0)}`; isPositive = month.pnl >= 0; break;
                case "trades": displayValue = String(month.trades); isPositive = month.trades > 0; break;
                case "winrate": displayValue = `${month.winRate.toFixed(0)}%`; isPositive = month.winRate >= 50; break;
                case "points": displayValue = `${month.points.toFixed(0)}`; isPositive = month.points >= 0; break;
              }
              
              return (
                <div
                  key={index}
                  className={`text-center p-2 md:p-3 rounded-lg transition-all ${
                    month.highlight 
                      ? "bg-primary/10 border border-primary/25" 
                      : "bg-muted/20 border border-transparent hover:bg-muted/40"
                  }`}
                >
                  <p className={`text-sm md:text-base font-bold truncate ${
                    month.highlight ? (isPositive ? "text-success" : "text-destructive") : "text-foreground"
                  }`}>
                    {displayValue}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{month.trades} עס׳</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{month.month}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Goals Tracker */}
      <GoalsTracker goals={goals} trades={trades} onCreateGoal={createGoal} onDeleteGoal={deleteGoal} />

      {/* Weekly Review */}
      <WeeklyReview trades={trades} />

      <AddTradeDialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} onTradeAdded={fetchTrades} />
      <ShareStatsDialog open={isShareOpen} onOpenChange={setIsShareOpen} stats={stats} displayMode={displayMode === "percentage" || displayMode === "balance" ? "money" : displayMode} />
    </DashboardLayout>
  );
};

export default Dashboard;
