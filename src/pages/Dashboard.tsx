import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { TradingScore } from "@/components/dashboard/TradingScore";
import { ShareStatsDialog } from "@/components/dashboard/ShareStatsDialog";
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";

import { AddTradeDialog } from "@/components/trades/AddTradeDialog";
import { useTrades } from "@/hooks/useTrades";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Plus, 
  Activity,
  Zap,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Trophy,
  Skull,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, getDay, differenceInSeconds, differenceInMinutes } from "date-fns";
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

  // Get recent trades (last 5)
  const recentTrades = trades.slice(0, 5);

  // Calculate portfolio balance first (needed for weeklyData)
  const portfolioBalance = activePortfolio?.balance || 0;

  // Calculate weekly data from real trades (reversed for RTL display)
  const weeklyData = useMemo(() => {
    const days = ["ש׳", "ו׳", "ה׳", "ד׳", "ג׳", "ב׳", "א׳"];
    const dayIndexes = [6, 5, 4, 3, 2, 1, 0]; // Saturday to Sunday
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
        case "points":
          value = pointsValue;
          break;
        case "percentage":
          value = portfolioBalance > 0 ? (pnlValue / portfolioBalance) * 100 : 0;
          break;
        case "balance":
        case "money":
        default:
          value = pnlValue;
          break;
      }
      
      return { day, value, pnl: pnlValue, points: pointsValue, trades: dayTrades.length };
    });
  }, [trades, displayMode, portfolioBalance]);

  // Calculate monthly breakdown from real trades
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
        pnl,
        points,
        trades: monthTrades.length,
        winRate,
        highlight: i === 0 && monthTrades.length > 0,
      });
    }
    
    return months.reverse();
  }, [trades]);

  // Calculate streaks and best/worst trades
  const tradingStreaks = useMemo(() => {
    if (trades.length === 0) return { currentStreak: 0, isWinning: true, maxWinStreak: 0, maxLoseStreak: 0, bestTrade: null, worstTrade: null };
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(b.entry_date || b.created_at).getTime() - new Date(a.entry_date || a.created_at).getTime()
    );
    
    // Current streak
    let currentStreak = 0;
    let isWinning = (sortedTrades[0]?.pnl || 0) > 0;
    for (const trade of sortedTrades) {
      const isWin = (trade.pnl || 0) > 0;
      const isLoss = (trade.pnl || 0) < 0;
      if (trade.pnl === 0) continue; // Skip break-even
      if ((isWinning && isWin) || (!isWinning && isLoss)) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Max streaks
    let maxWinStreak = 0, maxLoseStreak = 0;
    let tempWin = 0, tempLose = 0;
    for (const trade of sortedTrades) {
      if ((trade.pnl || 0) > 0) {
        tempWin++;
        tempLose = 0;
        maxWinStreak = Math.max(maxWinStreak, tempWin);
      } else if ((trade.pnl || 0) < 0) {
        tempLose++;
        tempWin = 0;
        maxLoseStreak = Math.max(maxLoseStreak, tempLose);
      }
    }
    
    // Best and worst trades
    const bestTrade = trades.reduce((best, t) => (t.pnl || 0) > (best?.pnl || -Infinity) ? t : best, trades[0]);
    const worstTrade = trades.reduce((worst, t) => (t.pnl || 0) < (worst?.pnl || Infinity) ? t : worst, trades[0]);
    
    return { currentStreak, isWinning, maxWinStreak, maxLoseStreak, bestTrade, worstTrade };
  }, [trades]);

  // Calculate equity curve data
  const equityCurveData = useMemo(() => {
    if (trades.length === 0) return [];
    
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.entry_date || a.created_at).getTime() - new Date(b.entry_date || b.created_at).getTime()
    );
    
    let cumulative = 0;
    return sortedTrades.map((trade, index) => {
      cumulative += (trade.pnl || 0);
      return {
        index: index + 1,
        date: format(new Date(trade.entry_date || trade.created_at), "dd/MM"),
        equity: cumulative,
        pnl: trade.pnl || 0,
      };
    });
  }, [trades]);

  // Calculate trade time performance (by hour of entry) - aggregated by hour
  const tradeTimePerformance = useMemo(() => {
    const hourlyData: { [hour: number]: { totalPnl: number; count: number; wins: number; losses: number } } = {};
    
    trades
      .filter(t => t.entry_date && t.pnl !== null)
      .forEach(trade => {
        const entryDate = new Date(trade.entry_date!);
        const hour = entryDate.getHours();
        const pnl = trade.pnl || 0;
        
        if (!hourlyData[hour]) {
          hourlyData[hour] = { totalPnl: 0, count: 0, wins: 0, losses: 0 };
        }
        hourlyData[hour].totalPnl += pnl;
        hourlyData[hour].count += 1;
        if (pnl > 0) hourlyData[hour].wins += 1;
        if (pnl < 0) hourlyData[hour].losses += 1;
      });
    
    // Create array from 6:00 to 23:00 with all hours (fill gaps with 0)
    return Array.from({ length: 18 }, (_, i) => {
      const hour = i + 6;
      const data = hourlyData[hour] || { totalPnl: 0, count: 0, wins: 0, losses: 0 };
      return {
        hour,
        hourLabel: `${hour}:00`,
        pnl: data.totalPnl,
        count: data.count,
        wins: data.wins,
        losses: data.losses,
        winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
      };
    });
  }, [trades]);

  // Calculate trade duration performance
  const tradeDurationPerformance = useMemo(() => {
    return trades
      .filter(t => t.entry_date && t.exit_date && t.pnl !== null)
      .map(trade => {
        const entryDate = new Date(trade.entry_date!);
        const exitDate = new Date(trade.exit_date!);
        const durationSeconds = differenceInSeconds(exitDate, entryDate);
        const durationMinutes = differenceInMinutes(exitDate, entryDate);
        const pnl = trade.pnl || 0;
        const isWin = pnl > 0;
        const isLoss = pnl < 0;
        
        // Format duration label
        let durationLabel: string;
        if (durationSeconds < 60) {
          durationLabel = `${durationSeconds}s`;
        } else if (durationMinutes < 60) {
          const secs = durationSeconds % 60;
          durationLabel = `${durationMinutes}m:${secs.toString().padStart(2, '0')}s`;
        } else {
          const hours = Math.floor(durationMinutes / 60);
          const mins = durationMinutes % 60;
          durationLabel = `${hours}h:${mins.toString().padStart(2, '0')}m`;
        }
        
        return {
          duration: durationSeconds,
          durationMinutes,
          durationLabel,
          pnl,
          symbol: trade.symbol,
          type: isWin ? "win" : isLoss ? "loss" : "breakeven",
        };
      })
      .sort((a, b) => a.duration - b.duration);
  }, [trades]);

  // Calculate percentage of portfolio (portfolioBalance already defined above)
  const percentageDisplay = portfolioBalance > 0 
    ? (stats.totalPnl / portfolioBalance) * 100 
    : 0;
  const balanceWithPnl = portfolioBalance + stats.totalPnl;

  const totalDisplay = displayMode === "money" 
    ? stats.totalPnl 
    : displayMode === "points" 
      ? stats.totalPoints 
      : displayMode === "percentage"
        ? percentageDisplay
        : balanceWithPnl;
  const avgDisplay = displayMode === "money" || displayMode === "balance" 
    ? stats.avgPnl 
    : displayMode === "points" 
      ? stats.avgPoints 
      : portfolioBalance > 0 ? (stats.avgPnl / portfolioBalance) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="mt-8 md:mt-0">
            <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              סקירה כללית
            </h1>
            <p className="text-muted-foreground mt-1 text-xs md:text-base">ניתוח הביצועים שלך במבט אחד</p>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3 flex-wrap max-w-full">
            <DateRangeFilter 
              dateRange={dateRange} 
              onDateRangeChange={setDateRange} 
            />
            <div className="flex bg-secondary/50 rounded-lg p-1 flex-wrap">
              <Button 
                variant="ghost"
                size="sm" 
                className={`transition-all text-xs md:text-sm ${displayMode === "money" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                onClick={() => setDisplayMode("money")}
              >
                💵 <span className="hidden sm:inline ml-1">כסף</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className={`transition-all text-xs md:text-sm ${displayMode === "points" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                onClick={() => setDisplayMode("points")}
              >
                📊 <span className="hidden sm:inline ml-1">נקודות</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className={`transition-all text-xs md:text-sm ${displayMode === "percentage" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                onClick={() => setDisplayMode("percentage")}
                title="אחוז מיתרת התיק"
              >
                📈 <span className="hidden sm:inline ml-1">אחוזים</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className={`transition-all text-xs md:text-sm ${displayMode === "balance" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                onClick={() => setDisplayMode("balance")}
                title="מצב התיק - יתרה + רווח/הפסד"
              >
                💰 <span className="hidden sm:inline ml-1">מצב תיק</span>
              </Button>
            </div>
            <Button 
              variant="outline"
              size="icon"
              className="hover:bg-primary/10 hover:border-primary h-8 w-8 md:h-10 md:w-10"
              onClick={() => setIsShareOpen(true)}
              title="שתף את הביצועים שלך"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button 
              className="gap-2 bg-gradient-to-l from-primary to-primary/80 hover:opacity-90 shadow-lg shadow-primary/25 text-xs md:text-sm"
              onClick={() => setIsAddTradeOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">הוסף עסקה</span>
              <span className="sm:hidden">הוסף</span>
            </Button>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {/* Total PnL */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-2.5 md:p-5 group hover:border-primary/30 transition-all min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-primary/50" />
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1 truncate">
                  {displayMode === "percentage" ? "תשואה" : displayMode === "balance" ? "מצב תיק" : "רווח/הפסד"}
                </p>
                <p className={`text-lg md:text-3xl font-bold truncate ${displayMode === "balance" ? (balanceWithPnl >= portfolioBalance ? 'text-success' : 'text-destructive') : (totalDisplay >= 0 ? 'text-success' : 'text-destructive')}`}>
                  {displayMode === "balance" 
                    ? `$${balanceWithPnl.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : `${totalDisplay >= 0 ? '+' : ''}${displayMode === "money" 
                      ? `$${totalDisplay.toFixed(2)}` 
                      : displayMode === "points" 
                        ? `${totalDisplay.toFixed(1)}` 
                        : `${totalDisplay.toFixed(2)}%`}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {displayMode === "balance" 
                    ? `יתרה: $${portfolioBalance.toLocaleString()} | רווח: ${stats.totalPnl >= 0 ? '+' : ''}$${stats.totalPnl.toFixed(2)}`
                    : `${stats.totalTrades} עסקאות`}
                </p>
              </div>
              <div className={`p-2 md:p-3 rounded-xl shrink-0 ${totalDisplay >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {totalDisplay >= 0 ? (
                  <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 md:h-6 md:w-6 text-destructive" />
                )}
              </div>
            </div>
          </Card>

          {/* Win Rate */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-2.5 md:p-5 group hover:border-primary/30 transition-all min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-warning to-warning/50" />
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">אחוז הצלחה</p>
                <p className="text-lg md:text-3xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 mt-0.5 md:mt-1 flex-wrap">
                  <span className="text-[10px] md:text-xs text-success">{stats.winningTrades} רווח</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground">|</span>
                  <span className="text-[10px] md:text-xs text-destructive">{stats.losingTrades} הפסד</span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-warning/10 shrink-0">
                <Target className="h-4 w-4 md:h-6 md:w-6 text-warning" />
              </div>
            </div>
            <div className="mt-2 md:mt-3 h-1.5 md:h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-success to-success/70 transition-all"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
          </Card>

          {/* Avg RR */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-2.5 md:p-5 group hover:border-primary/30 transition-all min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-primary/50" />
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">Avg RR</p>
                <p className="text-lg md:text-3xl font-bold text-foreground">{stats.avgRR.toFixed(2)}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">
                  {stats.avgRR >= 2 ? '🔥 מצוין' : stats.avgRR >= 1 ? '✓ טוב' : '⚠️ לשפר'}
                </p>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-primary/10 shrink-0">
                <Zap className="h-4 w-4 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Average PnL */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-2.5 md:p-5 group hover:border-primary/30 transition-all min-w-0">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-success to-success/50" />
            <div className="flex items-start justify-between gap-1">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] md:text-sm text-muted-foreground mb-0.5 md:mb-1">ממוצע לעסקה</p>
                <p className={`text-lg md:text-3xl font-bold truncate ${avgDisplay >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {displayMode === "money" || displayMode === "balance"
                    ? `$${stats.avgPnl.toFixed(0)}` 
                    : displayMode === "points"
                      ? stats.avgPoints.toFixed(1)
                      : `${avgDisplay.toFixed(1)}%`}
                </p>
                <div className="flex items-center gap-1 mt-0.5 md:mt-1">
                  <span className="text-[10px] md:text-xs text-success">↑ ${stats.maxWin.toFixed(0)}</span>
                  <span className="text-[10px] md:text-xs text-destructive">↓ ${Math.abs(stats.maxLoss).toFixed(0)}</span>
                </div>
              </div>
              <div className="p-2 md:p-3 rounded-xl bg-success/10 shrink-0">
                <Activity className="h-4 w-4 md:h-6 md:w-6 text-success" />
              </div>
            </div>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-7 space-y-3 md:space-y-4">
            <TradingCalendar trades={trades} displayMode={displayMode} portfolioBalance={portfolioBalance} />

            {/* Streaks & Records */}
            <Card className="bg-card/50 border-border/50 p-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                <Flame className="h-4 w-4 text-primary" />
                רצפים ושיאים
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Current Streak */}
                <div className={`rounded-xl p-4 ${tradingStreaks.isWinning ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className={`h-5 w-5 ${tradingStreaks.isWinning ? 'text-success' : 'text-destructive'}`} />
                    <span className="text-sm text-muted-foreground">רצף נוכחי</span>
                  </div>
                  <p className={`text-2xl font-bold ${tradingStreaks.isWinning ? 'text-success' : 'text-destructive'}`}>
                    {tradingStreaks.currentStreak} {tradingStreaks.isWinning ? 'זכיות' : 'הפסדים'}
                  </p>
                </div>
                
                {/* Max Streaks */}
                <div className="bg-secondary/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">שיאי רצפים</p>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-lg font-bold text-success">{tradingStreaks.maxWinStreak}</p>
                      <p className="text-xs text-muted-foreground">זכיות</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-destructive">{tradingStreaks.maxLoseStreak}</p>
                      <p className="text-xs text-muted-foreground">הפסדים</p>
                    </div>
                  </div>
                </div>
                
                {/* Best Trade */}
                {tradingStreaks.bestTrade && (
                  <div className="bg-success/5 rounded-xl p-4 border border-success/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">העסקה הטובה ביותר</span>
                    </div>
                    <p className="text-lg font-bold text-success">
                      {displayMode === "points" 
                        ? `+${(tradingStreaks.bestTrade.pnl_points || 0).toFixed(0)} נק׳`
                        : `+$${(tradingStreaks.bestTrade.pnl || 0).toFixed(0)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{tradingStreaks.bestTrade.symbol}</p>
                  </div>
                )}
                
                {/* Worst Trade */}
                {tradingStreaks.worstTrade && (
                  <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Skull className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">העסקה הגרועה ביותר</span>
                    </div>
                    <p className="text-lg font-bold text-destructive">
                      {displayMode === "points" 
                        ? `${(tradingStreaks.worstTrade.pnl_points || 0).toFixed(0)} נק׳`
                        : `$${(tradingStreaks.worstTrade.pnl || 0).toFixed(0)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{tradingStreaks.worstTrade.symbol}</p>
                  </div>
                )}
              </div>
            </Card>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-5 space-y-4">
            {/* Trading Score */}
            <TradingScore 
              winRate={stats.winRate}
              avgRR={stats.avgRR}
              avgWinLossRatio={stats.avgWin > 0 && stats.avgLoss !== 0 ? Math.abs(stats.avgWin / stats.avgLoss) : 0}
            />

            {/* Weekly Performance */}
            <Card className="bg-card/50 border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  ביצועים שבועיים
                </h3>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => {
                        let formatted: string;
                        switch (displayMode) {
                          case "points":
                            formatted = `${value.toFixed(1)} נק׳`;
                            break;
                          case "percentage":
                            formatted = `${value.toFixed(2)}%`;
                            break;
                          case "balance":
                          case "money":
                          default:
                            formatted = `$${value.toFixed(2)}`;
                            break;
                        }
                        return [formatted, "רווח/הפסד"];
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[6, 6, 0, 0]}
                      fill="url(#barGradient)"
                    />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--primary) / 0.5)" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Recent Trades */}
            <Card className="bg-card/50 border-border/50 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  עסקאות אחרונות
                </h3>
              </div>
              <div className="space-y-2">
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">אין עסקאות להצגה</p>
                    <Button 
                      variant="link" 
                      className="text-primary mt-2"
                      onClick={() => setIsAddTradeOpen(true)}
                    >
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
                        case "points":
                          return `${isProfit ? '+' : ''}${pointsValue.toFixed(1)} נק׳`;
                        case "percentage":
                          const pct = portfolioBalance > 0 ? (moneyValue / portfolioBalance) * 100 : 0;
                          return `${isProfit ? '+' : ''}${pct.toFixed(2)}%`;
                        case "balance":
                        case "money":
                        default:
                          return `${isProfit ? '+' : ''}$${moneyValue.toFixed(2)}`;
                      }
                    };
                    
                    return (
                      <div 
                        key={trade.id}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isProfit ? 'bg-success/10' : 'bg-destructive/10'}`}>
                            {isProfit ? (
                              <ArrowUpRight className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{trade.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {trade.entry_date 
                                ? new Date(trade.entry_date).toLocaleDateString('he-IL') 
                                : new Date(trade.created_at).toLocaleDateString('he-IL')}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
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

        {/* Trade Time & Duration Performance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Trade Time Performance */}
          <Card className="bg-card/50 border-border/50 p-3 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm md:text-base">
                🕐 ביצועים לפי שעת כניסה
              </h3>
            </div>
            {tradeTimePerformance.length === 0 ? (
              <div className="h-48 md:h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">אין מספיק נתונים</p>
              </div>
            ) : (
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={tradeTimePerformance} margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                    <defs>
                      <linearGradient id="colorPnlTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="hourLabel" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">שעה: {data.hourLabel}</p>
                              <p className={`font-bold ${data.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                ${data.pnl.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {data.count} עסקאות | {data.winRate}% הצלחה
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone"
                      dataKey="pnl" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#colorPnlTime)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          {/* Trade Duration Performance */}
          <Card className="bg-card/50 border-border/50 p-3 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm md:text-base">
                ⏱️ ביצועים לפי משך עסקה
              </h3>
            </div>
            {tradeDurationPerformance.length === 0 ? (
              <div className="h-48 md:h-64 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">אין מספיק נתונים (נדרש תאריך כניסה ויציאה)</p>
              </div>
            ) : (
              <div className="h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                    <XAxis 
                      dataKey="durationMinutes" 
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => {
                        if (value < 1) return `${Math.round(value * 60)}s`;
                        if (value < 60) return `${Math.round(value)}m`;
                        return `${Math.round(value / 60)}h`;
                      }}
                    />
                    <YAxis 
                      dataKey="pnl"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                              <p className="font-medium">{data.symbol}</p>
                              <p className="text-sm text-muted-foreground">משך: {data.durationLabel}</p>
                              <p className={`font-bold ${data.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                ${data.pnl.toFixed(2)}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter 
                      data={tradeDurationPerformance} 
                      fill="hsl(var(--primary))"
                    >
                      {tradeDurationPerformance.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`}
                          fill={
                            entry.type === "win" 
                              ? "hsl(var(--success))" 
                              : entry.type === "loss" 
                                ? "hsl(var(--destructive))" 
                                : "hsl(var(--primary))"
                          }
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        {/* Monthly Breakdown */}
        <Card className="bg-card/50 border-border/50 p-3 md:p-5 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 md:mb-5">
            <div className="flex bg-secondary/50 rounded-lg p-1 overflow-x-auto max-w-full">
              {[
                { key: "pnl", label: "💰", labelFull: "💰 רווח/הפסד" },
                { key: "trades", label: "📈", labelFull: "📈 עסקאות" },
                { key: "winrate", label: "🎯", labelFull: "🎯 הצלחה" },
                { key: "points", label: "📊", labelFull: "📊 נקודות" },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant="ghost"
                  size="sm"
                  className={`transition-all text-xs md:text-sm whitespace-nowrap ${monthlyViewMode === item.key ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                  onClick={() => setMonthlyViewMode(item.key as MonthlyViewMode)}
                >
                  <span className="md:hidden">{item.label}</span>
                  <span className="hidden md:inline">{item.labelFull}</span>
                </Button>
              ))}
            </div>
            <span className="text-muted-foreground mr-auto font-medium text-sm">2025</span>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 md:gap-3">
            {monthlyBreakdown.map((month, index) => {
              let displayValue: string;
              let isPositive = true;
              
              switch (monthlyViewMode) {
                case "pnl":
                  displayValue = `$${month.pnl.toFixed(0)}`;
                  isPositive = month.pnl >= 0;
                  break;
                case "trades":
                  displayValue = String(month.trades);
                  isPositive = month.trades > 0;
                  break;
                case "winrate":
                  displayValue = `${month.winRate.toFixed(0)}%`;
                  isPositive = month.winRate >= 50;
                  break;
                case "points":
                  displayValue = `${month.points.toFixed(0)}`;
                  isPositive = month.points >= 0;
                  break;
              }
              
              return (
                <div
                  key={index}
                  className={`text-center p-2 md:p-4 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                    month.highlight 
                      ? "bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10" 
                      : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                  }`}
                >
                  <p className={`text-sm md:text-lg font-bold truncate ${
                    month.highlight 
                      ? (isPositive ? "text-success" : "text-destructive")
                      : "text-foreground"
                  }`}>
                    {displayValue}
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{month.trades} עס׳</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 font-medium">{month.month}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <AddTradeDialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} onTradeAdded={fetchTrades} />
      <ShareStatsDialog open={isShareOpen} onOpenChange={setIsShareOpen} stats={stats} displayMode={displayMode === "percentage" || displayMode === "balance" ? "money" : displayMode} />
    </DashboardLayout>
  );
};

export default Dashboard;
