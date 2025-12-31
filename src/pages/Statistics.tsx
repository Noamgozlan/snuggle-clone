import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useTrades } from "@/hooks/useTrades";
import { TrendingUp, TrendingDown, Calendar, Target, Clock, Zap, Hash, DollarSign, BarChart2, Award, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TradeConfirmation {
  trade_id: string;
  confirmation_name: string;
}

interface ConfirmationStats {
  name: string;
  totalTrades: number;
  winningTrades: number;
  winRate: number;
  avgPnl: number;
  totalPnl: number;
}

const Statistics = () => {
  const { trades, stats, loading } = useTrades();
  const { user } = useAuth();
  const [tradeConfirmations, setTradeConfirmations] = useState<TradeConfirmation[]>([]);
  const [confirmationStats, setConfirmationStats] = useState<ConfirmationStats[]>([]);

  // Fetch trade confirmations
  useEffect(() => {
    const fetchConfirmations = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('trade_confirmations')
        .select('trade_id, confirmation_name');
      
      if (!error && data) {
        setTradeConfirmations(data);
      }
    };

    fetchConfirmations();
  }, [user]);

  // Calculate confirmation statistics
  useEffect(() => {
    if (trades.length === 0 || tradeConfirmations.length === 0) {
      setConfirmationStats([]);
      return;
    }

    const confirmationMap: Record<string, { trades: typeof trades }> = {};

    tradeConfirmations.forEach(tc => {
      const trade = trades.find(t => t.id === tc.trade_id);
      if (trade) {
        if (!confirmationMap[tc.confirmation_name]) {
          confirmationMap[tc.confirmation_name] = { trades: [] };
        }
        confirmationMap[tc.confirmation_name].trades.push(trade);
      }
    });

    const stats: ConfirmationStats[] = Object.entries(confirmationMap).map(([name, data]) => {
      const winningTrades = data.trades.filter(t => (t.pnl || 0) > 0);
      const totalPnl = data.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      return {
        name,
        totalTrades: data.trades.length,
        winningTrades: winningTrades.length,
        winRate: data.trades.length > 0 ? (winningTrades.length / data.trades.length) * 100 : 0,
        avgPnl: data.trades.length > 0 ? totalPnl / data.trades.length : 0,
        totalPnl,
      };
    });

    // Sort by win rate descending
    stats.sort((a, b) => b.winRate - a.winRate);
    setConfirmationStats(stats);
  }, [trades, tradeConfirmations]);

  // Calculate advanced statistics
  const longTrades = trades.filter(t => t.trade_type === 'long');
  const shortTrades = trades.filter(t => t.trade_type === 'short');
  
  const longWins = longTrades.filter(t => (t.pnl || 0) > 0);
  const longLosses = longTrades.filter(t => (t.pnl || 0) < 0);
  const shortWins = shortTrades.filter(t => (t.pnl || 0) > 0);
  const shortLosses = shortTrades.filter(t => (t.pnl || 0) < 0);
  
  const longWinRate = longTrades.length > 0 ? (longWins.length / longTrades.length) * 100 : 0;
  const shortWinRate = shortTrades.length > 0 ? (shortWins.length / shortTrades.length) * 100 : 0;
  
  const longAvgWin = longWins.length > 0 ? longWins.reduce((sum, t) => sum + (t.pnl || 0), 0) / longWins.length : 0;
  const longAvgLoss = longLosses.length > 0 ? Math.abs(longLosses.reduce((sum, t) => sum + (t.pnl || 0), 0)) / longLosses.length : 0;
  const shortAvgWin = shortWins.length > 0 ? shortWins.reduce((sum, t) => sum + (t.pnl || 0), 0) / shortWins.length : 0;
  const shortAvgLoss = shortLosses.length > 0 ? Math.abs(shortLosses.reduce((sum, t) => sum + (t.pnl || 0), 0)) / shortLosses.length : 0;

  // Calculate average profit and average loss
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0);
  const losingTrades = trades.filter(t => (t.pnl || 0) < 0);
  const avgProfit = winningTrades.length > 0 ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losingTrades.length : 0;

  // Find best/worst symbol
  const symbolStats = trades.reduce((acc, trade) => {
    if (!acc[trade.symbol]) {
      acc[trade.symbol] = { pnl: 0, trades: 0 };
    }
    acc[trade.symbol].pnl += trade.pnl || 0;
    acc[trade.symbol].trades++;
    return acc;
  }, {} as Record<string, { pnl: number; trades: number }>);

  const sortedSymbols = Object.entries(symbolStats).sort((a, b) => b[1].pnl - a[1].pnl);
  const bestSymbol = sortedSymbols[0];
  const worstSymbol = sortedSymbols[sortedSymbols.length - 1];

  // Calculate day statistics
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const dayStats = trades.reduce((acc, trade) => {
    const date = new Date(trade.entry_date || trade.created_at);
    const day = date.getDay();
    if (!acc[day]) {
      acc[day] = { pnl: 0, trades: 0 };
    }
    acc[day].pnl += trade.pnl || 0;
    acc[day].trades++;
    return acc;
  }, {} as Record<number, { pnl: number; trades: number }>);

  const sortedDays = Object.entries(dayStats).sort((a, b) => b[1].pnl - a[1].pnl);
  const bestDay = sortedDays[0];
  const worstDay = sortedDays[sortedDays.length - 1];

  // Calculate streaks
  let currentWinStreak = 0;
  let maxWinStreak = 0;
  let currentLossStreak = 0;
  let maxLossStreak = 0;

  const sortedTrades = [...trades].sort((a, b) => 
    new Date(a.entry_date || a.created_at).getTime() - new Date(b.entry_date || b.created_at).getTime()
  );

  sortedTrades.forEach(trade => {
    if ((trade.pnl || 0) > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
    } else if ((trade.pnl || 0) < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
    }
  });

  // Calculate max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;

  sortedTrades.forEach(trade => {
    runningPnl += trade.pnl || 0;
    if (runningPnl > peak) {
      peak = runningPnl;
    }
    const drawdown = peak - runningPnl;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Calculate average contracts per trade
  const avgQuantity = trades.length > 0 
    ? trades.reduce((sum, t) => sum + (t.quantity || 1), 0) / trades.length 
    : 0;

  // Calculate best/worst day of trading
  const dailyPnl = trades.reduce((acc, trade) => {
    const date = new Date(trade.entry_date || trade.created_at).toDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += trade.pnl || 0;
    return acc;
  }, {} as Record<string, number>);

  const dailyPnlArray = Object.entries(dailyPnl);
  const bestDayPnl = dailyPnlArray.length > 0 ? dailyPnlArray.reduce((max, curr) => curr[1] > max[1] ? curr : max) : null;
  const worstDayPnl = dailyPnlArray.length > 0 ? dailyPnlArray.reduce((min, curr) => curr[1] < min[1] ? curr : min) : null;

  const totalGrossWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalGrossLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));

  if (loading) {
    return (
      <DashboardLayout title="סטטיסטיקות מתקדמות">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (trades.length === 0) {
    return (
      <DashboardLayout title="סטטיסטיקות מתקדמות">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BarChart2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">אין נתונים להצגה</h2>
          <p className="text-muted-foreground">הוסף עסקאות כדי לראות סטטיסטיקות</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="סטטיסטיקות מתקדמות">
      <div className="space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ממוצע רווח</p>
                <p className="text-2xl font-bold text-success">${avgProfit.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ממוצע הפסד</p>
                <p className="text-2xl font-bold text-destructive">${avgLoss.toFixed(2)}</p>
              </div>
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">אחוז הצלחה</p>
                <p className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                  {stats.winRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">{stats.winningTrades} מתוך {stats.totalTrades}</p>
              </div>
              <div className={`p-2 rounded-lg ${stats.winRate >= 50 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                <Target className={`h-5 w-5 ${stats.winRate >= 50 ? 'text-success' : 'text-destructive'}`} />
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ממוצע רווח/הפסד לעסקה</p>
                <p className={`text-2xl font-bold ${stats.avgPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.avgPnl.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Chart Section */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                סיווג רווח/הפסד
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-success w-20">${stats.maxWin.toFixed(0)}</span>
                <div 
                  className="h-4 bg-success rounded-full transition-all"
                  style={{ width: `${stats.maxWin > 0 ? 100 : 0}%` }}
                />
                <span className="text-xs text-muted-foreground">רווח מקס׳</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-destructive w-20">${Math.abs(stats.maxLoss).toFixed(0)}</span>
                <div 
                  className="h-4 bg-destructive/30 rounded-full transition-all"
                  style={{ width: `${stats.maxLoss < 0 ? (Math.abs(stats.maxLoss) / (stats.maxWin || 1)) * 100 : 0}%`, maxWidth: '100%' }}
                />
                <span className="text-xs text-muted-foreground">הפסד מקס׳</span>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                יחס לונג/שורט
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground">לונג:</p>
                <p className="text-xl font-bold text-foreground">{longTrades.length}</p>
                <p className="text-xs text-muted-foreground">
                  {trades.length > 0 ? ((longTrades.length / trades.length) * 100).toFixed(0) : 0}% לונג
                </p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center flex-1">
                <p className="text-sm text-muted-foreground">שורט:</p>
                <p className="text-xl font-bold text-foreground">{shortTrades.length}</p>
                <p className="text-xs text-muted-foreground">
                  {trades.length > 0 ? ((shortTrades.length / trades.length) * 100).toFixed(0) : 0}% שורט
                </p>
              </div>
            </div>
            <div className="mt-4 flex h-2 rounded-full overflow-hidden">
              <div 
                className="bg-success transition-all" 
                style={{ width: `${trades.length > 0 ? (longTrades.length / trades.length) * 100 : 50}%` }}
              />
              <div 
                className="bg-destructive transition-all" 
                style={{ width: `${trades.length > 0 ? (shortTrades.length / trades.length) * 100 : 50}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Confirmation Analysis Section */}
        {confirmationStats.length > 0 && (
          <Card className="bg-card border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              ניתוח אישורי אסטרטגיה
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              אילו אישורים מהאסטרטגיות שלך מובילים להצלחה גבוהה יותר?
            </p>
            <div className="grid gap-4">
              {confirmationStats.map((conf, index) => {
                const isTopPerformer = index === 0 && conf.winRate >= 60;
                return (
                  <div 
                    key={conf.name}
                    className={`p-4 rounded-lg border ${
                      isTopPerformer 
                        ? 'border-success/50 bg-success/5' 
                        : 'border-border bg-background/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-5 w-5 ${conf.winRate >= 60 ? 'text-success' : conf.winRate >= 40 ? 'text-primary' : 'text-destructive'}`} />
                        <span className="font-medium text-foreground">{conf.name}</span>
                        {isTopPerformer && (
                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                            הכי מנצח
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{conf.totalTrades} עסקאות</span>
                        <span className={`font-bold ${conf.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                          {conf.winRate.toFixed(0)}% הצלחה
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${conf.winRate >= 50 ? 'bg-success' : 'bg-destructive'}`}
                          style={{ width: `${conf.winRate}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className={conf.avgPnl >= 0 ? 'text-success' : 'text-destructive'}>
                          ממוצע: ${conf.avgPnl.toFixed(2)}
                        </span>
                        <span className={conf.totalPnl >= 0 ? 'text-success' : 'text-destructive'}>
                          סה״כ: ${conf.totalPnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {confirmationStats.length > 0 && confirmationStats[0].winRate >= 60 && (
              <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-sm text-success">
                  💡 <strong>תובנה:</strong> רוב העסקאות המנצחות שלך כוללות את האישור "{confirmationStats[0].name}" עם {confirmationStats[0].winRate.toFixed(0)}% הצלחה!
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-success" />
              <p className="text-sm text-muted-foreground">הנכס הרווחי ביותר</p>
            </div>
            <p className="text-xl font-bold text-success">{bestSymbol?.[0] || "—"}</p>
            <p className="text-sm text-muted-foreground">${bestSymbol?.[1].pnl.toFixed(2) || "0.00"}</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">הנכס המפסיד ביותר</p>
            </div>
            <p className="text-xl font-bold text-destructive">{worstSymbol?.[0] || "—"}</p>
            <p className="text-sm text-muted-foreground">${worstSymbol?.[1].pnl.toFixed(2) || "0.00"}</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-destructive" />
              <p className="text-sm text-muted-foreground">יום המפסיד ביותר</p>
            </div>
            <p className="text-xl font-bold text-foreground">{worstDay ? dayNames[parseInt(worstDay[0])] : "—"}</p>
            <p className="text-sm text-muted-foreground">${worstDay?.[1].pnl.toFixed(2) || "0.00"}</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-success" />
              <p className="text-sm text-muted-foreground">יום הרווחי ביותר</p>
            </div>
            <p className="text-xl font-bold text-success">{bestDay ? dayNames[parseInt(bestDay[0])] : "—"}</p>
            <p className="text-sm text-muted-foreground">${bestDay?.[1].pnl.toFixed(2) || "0.00"}</p>
          </Card>
        </div>

        {/* More Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">יום הרווח/הפסד ביותר</p>
            </div>
            <p className="text-success">${bestDayPnl?.[1].toFixed(2) || "0.00"}</p>
            <p className="text-destructive">${worstDayPnl?.[1].toFixed(2) || "0.00"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {bestDayPnl ? new Date(bestDayPnl[0]).toLocaleDateString('he-IL') : "—"} / {worstDayPnl ? new Date(worstDayPnl[0]).toLocaleDateString('he-IL') : "—"}
            </p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">מספר עסקאות סה״כ</p>
            </div>
            <p className="text-xl font-bold text-foreground">{stats.totalTrades}</p>
            <p className="text-xs text-muted-foreground">{stats.winningTrades} ✓ | {stats.losingTrades} ✗</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">משך עסקה ממוצע</p>
            </div>
            <p className="text-xl font-bold text-foreground">אין נתונים</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">ממוצע חוזים לעסקה</p>
            </div>
            <p className="text-xl font-bold text-foreground">{avgQuantity.toFixed(2)}</p>
          </Card>
        </div>

        {/* Long/Short Analysis */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              ניתוח עסקאות לונג
            </h3>
            {longTrades.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">אין עסקאות לונג</p>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-4">{longTrades.length} עסקאות</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">אחוז הצלחה</p>
                    <p className={`text-xl font-bold ${longWinRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {longWinRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ניצחונות/הפסדים</p>
                    <p className="text-xl font-bold text-foreground">{longWins.length} - {longLosses.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">הפסד ממוצע</p>
                    <p className="text-xl font-bold text-destructive">${longAvgLoss.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">רווח ממוצע</p>
                    <p className="text-xl font-bold text-success">${longAvgWin.toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </Card>

          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              ניתוח עסקאות שורט
            </h3>
            {shortTrades.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">אין עסקאות שורט</p>
            ) : (
              <>
                <p className="text-muted-foreground text-sm mb-4">{shortTrades.length} עסקאות</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">אחוז הצלחה</p>
                    <p className={`text-xl font-bold ${shortWinRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                      {shortWinRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ניצחונות/הפסדים</p>
                    <p className="text-xl font-bold text-foreground">{shortWins.length} - {shortLosses.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">הפסד ממוצע</p>
                    <p className="text-xl font-bold text-destructive">${shortAvgLoss.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">רווח ממוצע</p>
                    <p className="text-xl font-bold text-success">${shortAvgWin.toFixed(2)}</p>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Bottom Stats Row */}
        <div className="grid grid-cols-6 gap-4">
          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">שעה רווחית ביותר</p>
            </div>
            <p className="text-lg font-bold text-foreground">אין נתונים</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">שעה מפסידה ביותר</p>
            </div>
            <p className="text-lg font-bold text-foreground">אין נתונים</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">סטריק ניצחונות</p>
            </div>
            <p className="text-lg font-bold text-success">{maxWinStreak}</p>
            <p className="text-xs text-muted-foreground">הארוך ביותר</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">סטריק הפסדים</p>
            </div>
            <p className="text-lg font-bold text-destructive">{maxLossStreak}</p>
            <p className="text-xs text-muted-foreground">הארוך ביותר</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Drawdown מקסימלי</p>
            </div>
            <p className="text-lg font-bold text-destructive">${maxDrawdown.toFixed(2)}</p>
          </Card>

          <Card className="bg-card border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">משך עסקה הפסידה ממוצע</p>
            </div>
            <p className="text-lg font-bold text-foreground">אין נתונים</p>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              סיכום כללי
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">סה״כ רווח/הפסד</span>
                <span className={`font-medium ${stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.totalPnl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">עסקאות רווחיות</span>
                <span className="text-foreground">{stats.winningTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">עסקאות מפסידות</span>
                <span className="text-foreground">{stats.losingTrades}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">עסקאות BE</span>
                <span className="text-foreground">{trades.filter(t => (t.pnl || 0) === 0).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ממוצע לעסקה</span>
                <span className={`font-medium ${stats.avgPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${stats.avgPnl.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          <Card className="bg-card border-border p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              יחס רווח/הפסד (Profit Factor)
            </h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">סה״כ רווחים</p>
                <p className="text-xl font-bold text-success">${totalGrossWins.toFixed(2)}</p>
              </div>
              <p className="text-4xl font-bold text-foreground">
                {totalGrossLosses > 0 ? stats.profitFactor.toFixed(2) : "∞"}
              </p>
              <div>
                <p className="text-sm text-muted-foreground">סה״כ הפסדים</p>
                <p className="text-xl font-bold text-destructive">${totalGrossLosses.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden">
              <div 
                className="bg-success transition-all"
                style={{ width: `${totalGrossWins + totalGrossLosses > 0 ? (totalGrossWins / (totalGrossWins + totalGrossLosses)) * 100 : 50}%` }}
              />
              <div 
                className="bg-destructive transition-all"
                style={{ width: `${totalGrossWins + totalGrossLosses > 0 ? (totalGrossLosses / (totalGrossWins + totalGrossLosses)) * 100 : 50}%` }}
              />
            </div>
            <p className="text-center text-xs text-muted-foreground mt-2">
              {stats.profitFactor >= 2 ? "מצוין! יחס מעל 2" : stats.profitFactor >= 1.5 ? "טוב! יחס מעל 1.5" : stats.profitFactor >= 1 ? "בסדר, יחס חיובי" : "צריך שיפור"}
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
