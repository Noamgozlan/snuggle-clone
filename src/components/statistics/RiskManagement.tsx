import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Trade } from "@/hooks/useTrades";
import { Shield, TrendingDown, Zap, BarChart2, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from "recharts";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface RiskManagementProps {
  trades: Trade[];
}

export const RiskManagement = ({ trades }: RiskManagementProps) => {
  const metrics = useMemo(() => {
    const sorted = [...trades].filter(t => t.entry_date && t.pnl !== null)
      .sort((a, b) => new Date(a.entry_date!).getTime() - new Date(b.entry_date!).getTime());

    if (sorted.length === 0) return null;

    // Drawdown calculation
    let peak = 0, maxDrawdown = 0, runningPnl = 0;
    const drawdownData: { date: string; drawdown: number; pnl: number }[] = [];
    sorted.forEach(t => {
      runningPnl += t.pnl || 0;
      if (runningPnl > peak) peak = runningPnl;
      const dd = peak - runningPnl;
      if (dd > maxDrawdown) maxDrawdown = dd;
      drawdownData.push({ date: format(new Date(t.entry_date!), "dd/MM", { locale: he }), drawdown: -dd, pnl: runningPnl });
    });

    // Sharpe Ratio (simplified: mean/std of daily returns)
    const returns = sorted.map(t => t.pnl || 0);
    const meanReturn = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

    // Expectancy
    const wins = sorted.filter(t => (t.pnl || 0) > 0);
    const losses = sorted.filter(t => (t.pnl || 0) < 0);
    const winRate = sorted.length > 0 ? wins.length / sorted.length : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl || 0), 0)) / losses.length : 0;
    const expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss);

    // Avg Risk per trade
    const tradesWithRisk = sorted.filter(t => t.risk && t.risk > 0);
    const avgRisk = tradesWithRisk.length > 0 ? tradesWithRisk.reduce((s, t) => s + (t.risk || 0), 0) / tradesWithRisk.length : 0;

    // Recovery Factor
    const totalPnl = sorted.reduce((s, t) => s + (t.pnl || 0), 0);
    const recoveryFactor = maxDrawdown > 0 ? totalPnl / maxDrawdown : 0;

    // R:R distribution
    const rrData = sorted.filter(t => t.rr !== null).map(t => ({
      rr: t.rr || 0,
      pnl: t.pnl || 0,
      symbol: t.symbol,
    }));

    return { maxDrawdown, sharpeRatio, expectancy, avgRisk, recoveryFactor, drawdownData, rrData, totalPnl };
  }, [trades]);

  if (!metrics) return <p className="text-center text-muted-foreground py-8">אין מספיק נתונים לניתוח סיכונים</p>;

  const statCards = [
    { label: "Max Drawdown", value: `$${metrics.maxDrawdown.toFixed(0)}`, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Sharpe Ratio", value: metrics.sharpeRatio.toFixed(2), icon: Zap, color: metrics.sharpeRatio >= 1 ? "text-success" : "text-yellow-400", bg: metrics.sharpeRatio >= 1 ? "bg-success/10" : "bg-yellow-400/10" },
    { label: "Expectancy", value: `$${metrics.expectancy.toFixed(2)}`, icon: BarChart2, color: metrics.expectancy >= 0 ? "text-success" : "text-destructive", bg: metrics.expectancy >= 0 ? "bg-success/10" : "bg-destructive/10" },
    { label: "Recovery Factor", value: metrics.recoveryFactor.toFixed(2), icon: Shield, color: metrics.recoveryFactor >= 2 ? "text-success" : "text-yellow-400", bg: metrics.recoveryFactor >= 2 ? "bg-success/10" : "bg-yellow-400/10" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(s => (
          <Card key={s.label} className="bg-card border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <div className={`p-1.5 rounded-md ${s.bg}`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border p-4">
          <h4 className="font-semibold mb-3 text-sm">Drawdown לאורך זמן</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.drawdownData}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="bg-card border-border p-4">
          <h4 className="font-semibold mb-3 text-sm">התפלגות R:R</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.rrData.slice(-30)}>
                <XAxis dataKey="symbol" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="rr">
                  {metrics.rrData.slice(-30).map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {metrics.maxDrawdown > metrics.totalPnl && metrics.totalPnl > 0 && (
        <div className="flex items-center gap-2 text-sm bg-destructive/10 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>ה-Drawdown המקסימלי גבוה מהרווח הכולל – מומלץ לבדוק את ניהול הסיכונים</span>
        </div>
      )}
    </div>
  );
};
