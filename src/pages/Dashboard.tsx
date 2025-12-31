import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { TradingCalendar } from "@/components/dashboard/TradingCalendar";
import { TradingScore } from "@/components/dashboard/TradingScore";
import { ShareStatsDialog } from "@/components/dashboard/ShareStatsDialog";

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
  Share2,
  Link,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, ScatterChart, Scatter, ZAxis, Cell } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, getDay, differenceInSeconds, differenceInMinutes } from "date-fns";
import { he } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

type DisplayMode = "money" | "points";
type MonthlyViewMode = "pnl" | "trades" | "winrate" | "points";

const Dashboard = () => {
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("money");
  const [monthlyViewMode, setMonthlyViewMode] = useState<MonthlyViewMode>("pnl");
  const { trades, stats, fetchTrades } = useTrades();
  const { user } = useAuth();

  // Get recent trades (last 5)
  const recentTrades = trades.slice(0, 5);

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
      
      const value = displayMode === "money" 
        ? dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
        : dayTrades.reduce((sum, t) => sum + (t.pnl_points || 0), 0);
      
      return { day, value, trades: dayTrades.length };
    });
  }, [trades, displayMode]);

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

  // Calculate trade time performance (by hour of entry)
  const tradeTimePerformance = useMemo(() => {
    return trades
      .filter(t => t.entry_date && t.pnl !== null)
      .map(trade => {
        const entryDate = new Date(trade.entry_date!);
        const hour = entryDate.getHours();
        const minutes = entryDate.getMinutes();
        const timeDecimal = hour + minutes / 60;
        const pnl = trade.pnl || 0;
        const isWin = pnl > 0;
        const isLoss = pnl < 0;
        return {
          time: timeDecimal,
          timeLabel: format(entryDate, "HH:mm"),
          pnl,
          symbol: trade.symbol,
          type: isWin ? "win" : isLoss ? "loss" : "breakeven",
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

  const totalDisplay = displayMode === "money" ? stats.totalPnl : stats.totalPoints;
  const avgDisplay = displayMode === "money" ? stats.avgPnl : stats.avgPoints;

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="mt-8 md:mt-0">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-l from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
              סקירה כללית
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">ניתוח הביצועים שלך במבט אחד</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="flex bg-secondary/50 rounded-lg p-1">
              <Button 
                variant="ghost"
                size="sm" 
                className={`transition-all text-xs md:text-sm ${displayMode === "money" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                onClick={() => setDisplayMode("money")}
              >
                💵 כסף
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className={`transition-all text-xs md:text-sm ${displayMode === "points" ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                onClick={() => setDisplayMode("points")}
              >
                📊 נקודות
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {/* Total PnL */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-3 md:p-5 group hover:border-primary/30 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-primary/50" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">סה״כ רווח/הפסד</p>
                <p className={`text-xl md:text-3xl font-bold ${totalDisplay >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalDisplay >= 0 ? '+' : ''}{displayMode === "money" ? `$${totalDisplay.toFixed(2)}` : `${totalDisplay.toFixed(1)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stats.totalTrades} עסקאות</p>
              </div>
              <div className={`p-3 rounded-xl ${totalDisplay >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                {totalDisplay >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-destructive" />
                )}
              </div>
            </div>
          </Card>

          {/* Win Rate */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-3 md:p-5 group hover:border-primary/30 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-warning to-warning/50" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">אחוז הצלחה</p>
                <p className="text-xl md:text-3xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 md:gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-success">{stats.winningTrades} רווח</span>
                  <span className="text-xs text-muted-foreground">|</span>
                  <span className="text-xs text-destructive">{stats.losingTrades} הפסד</span>
                  {stats.breakevenTrades > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">|</span>
                      <span className="text-xs text-warning">{stats.breakevenTrades} ברייק איבן</span>
                    </>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-warning/10">
                <Target className="h-6 w-6 text-warning" />
              </div>
            </div>
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-l from-success to-success/70 transition-all"
                style={{ width: `${stats.winRate}%` }}
              />
            </div>
          </Card>

          {/* Avg RR */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-3 md:p-5 group hover:border-primary/30 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-primary to-primary/50" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Avg RR</p>
                <p className="text-xl md:text-3xl font-bold text-foreground">{stats.avgRR.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.avgRR >= 2 ? '🔥 מצוין' : stats.avgRR >= 1 ? '✓ טוב' : '⚠️ לשפר'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          {/* Average PnL */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-3 md:p-5 group hover:border-primary/30 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-success to-success/50" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">ממוצע לעסקה</p>
                <p className={`text-xl md:text-3xl font-bold ${avgDisplay >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {displayMode === "money" ? `$${avgDisplay.toFixed(2)}` : avgDisplay.toFixed(1)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-success">↑ ${stats.maxWin.toFixed(0)}</span>
                  <span className="text-xs text-destructive">↓ ${Math.abs(stats.maxLoss).toFixed(0)}</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-success/10">
                <Activity className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-7 space-y-4">
            <TradingCalendar trades={trades} />

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
                    <p className="text-lg font-bold text-success">+${(tradingStreaks.bestTrade.pnl || 0).toFixed(0)}</p>
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
                    <p className="text-lg font-bold text-destructive">${(tradingStreaks.worstTrade.pnl || 0).toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">{tradingStreaks.worstTrade.symbol}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Broker Connection Coming Soon */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-5 group">
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                <div className="bg-primary/10 p-3 rounded-full mb-3">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">בקרוב...</span>
                <span className="text-xs text-muted-foreground mt-1">חיבור אוטומטי לברוקר</span>
              </div>
              <div className="flex items-start justify-between opacity-40">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">חיבור לברוקר</p>
                  <p className="text-2xl font-bold text-foreground">Tradovate</p>
                  <p className="text-xs text-muted-foreground mt-2">סנכרון אוטומטי של עסקאות</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <Link className="h-6 w-6 text-primary" />
                </div>
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
                      formatter={(value: number) => [displayMode === "money" ? `$${value.toFixed(2)}` : `${value.toFixed(1)} נק׳`, "רווח/הפסד"]}
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
                    const value = displayMode === "money" ? (trade.pnl || 0) : (trade.pnl_points || 0);
                    const isProfit = value >= 0;
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
                          {isProfit ? '+' : ''}{displayMode === "money" ? `$${value.toFixed(2)}` : `${value.toFixed(1)}`}
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
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 40 }}>
                    <XAxis 
                      dataKey="time" 
                      type="number"
                      domain={[6, 23]}
                      tickFormatter={(value) => `${Math.floor(value)}:00`}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
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
                              <p className="text-sm text-muted-foreground">שעה: {data.timeLabel}</p>
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
                      data={tradeTimePerformance} 
                      fill="hsl(var(--primary))"
                    >
                      {tradeTimePerformance.map((entry, index) => (
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
        <Card className="bg-card/50 border-border/50 p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="flex bg-secondary/50 rounded-lg p-1">
              {[
                { key: "pnl", label: "💰 רווח/הפסד" },
                { key: "trades", label: "📈 עסקאות" },
                { key: "winrate", label: "🎯 הצלחה" },
                { key: "points", label: "📊 נקודות" },
              ].map((item) => (
                <Button
                  key={item.key}
                  variant="ghost"
                  size="sm"
                  className={`transition-all ${monthlyViewMode === item.key ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-secondary"}`}
                  onClick={() => setMonthlyViewMode(item.key as MonthlyViewMode)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
            <span className="text-muted-foreground mr-auto font-medium">2025</span>
          </div>
          
          <div className="grid grid-cols-12 gap-3">
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
                  className={`text-center p-4 rounded-xl cursor-pointer transition-all hover:scale-105 ${
                    month.highlight 
                      ? "bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/30 shadow-lg shadow-primary/10" 
                      : "bg-secondary/30 hover:bg-secondary/50 border border-transparent"
                  }`}
                >
                  <p className={`text-lg font-bold ${
                    month.highlight 
                      ? (isPositive ? "text-success" : "text-destructive")
                      : "text-foreground"
                  }`}>
                    {displayValue}
                  </p>
                  <p className="text-xs text-muted-foreground">{month.trades} עס׳</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{month.month}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <AddTradeDialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} onTradeAdded={fetchTrades} />
      <ShareStatsDialog open={isShareOpen} onOpenChange={setIsShareOpen} stats={stats} displayMode={displayMode} />
    </DashboardLayout>
  );
};

export default Dashboard;
