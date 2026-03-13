import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trade } from "@/hooks/useTrades";
import { TrendingUp, Crosshair, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, ReferenceLine, CartesianGrid, ReferenceDot } from "recharts";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface InteractiveEquityCurveProps {
  trades: Trade[];
  language?: string;
}

export const InteractiveEquityCurve = ({ trades, language = "he" }: InteractiveEquityCurveProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { data, maxDrawdown, maxDrawdownIndex, peakIndex, allTimeHigh } = useMemo(() => {
    const sorted = [...trades]
      .filter(t => t.entry_date && t.is_closed)
      .sort((a, b) => new Date(a.entry_date!).getTime() - new Date(b.entry_date!).getTime());

    let cumulative = 0;
    let peak = 0;
    let maxDD = 0;
    let maxDDIdx = 0;
    let peakIdx = 0;
    let ath = 0;

    const chartData = sorted.map((trade, index) => {
      cumulative += trade.pnl || 0;
      
      if (cumulative > peak) {
        peak = cumulative;
        peakIdx = index;
      }
      if (cumulative > ath) ath = cumulative;
      
      const drawdown = peak - cumulative;
      if (drawdown > maxDD) {
        maxDD = drawdown;
        maxDDIdx = index;
      }

      return {
        index: index + 1,
        date: format(new Date(trade.entry_date!), "dd/MM", { locale: language === "he" ? he : undefined }),
        fullDate: format(new Date(trade.entry_date!), "dd/MM/yyyy"),
        pnl: trade.pnl || 0,
        cumulative,
        symbol: trade.symbol,
        strategy: trade.strategy || "—",
        tradeType: trade.trade_type,
        drawdown: -(peak - cumulative),
        peak,
      };
    });

    return { data: chartData, maxDrawdown: maxDD, maxDrawdownIndex: maxDDIdx, peakIndex: peakIdx, allTimeHigh: ath };
  }, [trades, language]);

  if (data.length === 0) {
    return (
      <Card className="bg-card border-border p-4 md:p-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          Equity Curve
        </h3>
        <div className="h-48 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">אין מספיק נתונים</p>
        </div>
      </Card>
    );
  }

  const lastValue = data[data.length - 1]?.cumulative || 0;

  return (
    <Card className="bg-card border-border p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Equity Curve
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            ATH: ${allTimeHigh.toFixed(0)}
          </Badge>
          <Badge variant="outline" className="text-[10px] gap-1 text-destructive border-destructive/30">
            Max DD: ${maxDrawdown.toFixed(0)}
          </Badge>
        </div>
      </div>

      <div className="h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 35 }}>
            <defs>
              <linearGradient id="equityGradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="equityGradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              tickFormatter={(v) => `$${v}`}
            />

            {/* Zero line */}
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />

            {/* Peak marker */}
            {peakIndex < data.length && (
              <ReferenceDot
                x={data[peakIndex]?.index}
                y={data[peakIndex]?.cumulative}
                r={4}
                fill="hsl(var(--success))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            )}

            {/* Max Drawdown marker */}
            {maxDrawdownIndex < data.length && maxDrawdown > 0 && (
              <ReferenceDot
                x={data[maxDrawdownIndex]?.index}
                y={data[maxDrawdownIndex]?.cumulative}
                r={4}
                fill="hsl(var(--destructive))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            )}

            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs min-w-[180px]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-foreground">{d.symbol}</span>
                        <Badge variant="outline" className="text-[9px]">
                          {d.tradeType === "long" ? "🟢 Long" : "🔴 Short"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-[10px]">{d.fullDate}</p>
                      <div className="border-t border-border mt-1.5 pt-1.5 space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">עסקה:</span>
                          <span className={d.pnl >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                            {d.pnl >= 0 ? "+" : ""}${d.pnl.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">סה״כ:</span>
                          <span className={`font-bold ${d.cumulative >= 0 ? "text-success" : "text-destructive"}`}>
                            ${d.cumulative.toFixed(2)}
                          </span>
                        </div>
                        {d.strategy !== "—" && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">אסטרטגיה:</span>
                            <span className="text-foreground">{d.strategy}</span>
                          </div>
                        )}
                        {d.drawdown < 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Drawdown:</span>
                            <span className="text-destructive">${d.drawdown.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="cumulative"
              stroke={lastValue >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              strokeWidth={2}
              fill={lastValue >= 0 ? "url(#equityGradientGreen)" : "url(#equityGradientRed)"}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.pnl >= 0) return null;
                // Show red dots for losing trades
                return (
                  <circle cx={cx} cy={cy} r={2.5} fill="hsl(var(--destructive))" opacity={0.6} />
                );
              }}
              activeDot={{
                r: 5,
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
                fill: "hsl(var(--primary))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-border">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">סה״כ</p>
          <p className={`text-sm font-bold ${lastValue >= 0 ? "text-success" : "text-destructive"}`}>
            ${lastValue.toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">שיא</p>
          <p className="text-sm font-bold text-success">${allTimeHigh.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">Max DD</p>
          <p className="text-sm font-bold text-destructive">-${maxDrawdown.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground">עסקאות</p>
          <p className="text-sm font-bold text-foreground">{data.length}</p>
        </div>
      </div>
    </Card>
  );
};
