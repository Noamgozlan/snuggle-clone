import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TradingScoreProps {
  winRate: number;
  avgRR: number;
  avgWinLossRatio: number;
  profitFactor?: number;
  maxDrawdown?: number;
  recoveryFactor?: number;
  consistency?: number;
}

export const TradingScore = ({ 
  winRate, avgRR, avgWinLossRatio, 
  profitFactor = 0, maxDrawdown = 0, recoveryFactor = 0, consistency = 0 
}: TradingScoreProps) => {
  // 6 metrics for hexagonal radar
  const metrics = useMemo(() => [
    { label: "Win %", value: Math.min(winRate, 100), angle: 270 },
    { label: "Profit factor", value: Math.min((profitFactor / 3) * 100, 100), angle: 330 },
    { label: "Avg win/loss", value: Math.min((avgWinLossRatio / 3) * 100, 100), angle: 30 },
    { label: "Recovery factor", value: Math.min((recoveryFactor / 3) * 100, 100), angle: 90 },
    { label: "Max drawdown", value: Math.min(maxDrawdown > 0 ? ((10 - Math.min(maxDrawdown, 10)) / 10) * 100 : 50, 100), angle: 150 },
    { label: "Consistency", value: Math.min(consistency, 100), angle: 210 },
  ], [winRate, profitFactor, avgWinLossRatio, recoveryFactor, maxDrawdown, consistency]);

  const overallScore = useMemo(() => {
    const score = (
      metrics[0].value * 0.25 +
      metrics[1].value * 0.20 +
      metrics[2].value * 0.15 +
      metrics[3].value * 0.15 +
      metrics[4].value * 0.10 +
      metrics[5].value * 0.15
    );
    return Math.min(score, 100);
  }, [metrics]);

  const centerX = 150;
  const centerY = 130;
  const maxRadius = 95;

  const getPoint = (angle: number, value: number) => {
    const r = maxRadius * (value / 100);
    const rad = (angle - 90) * (Math.PI / 180);
    return { x: centerX + r * Math.cos(rad), y: centerY + r * Math.sin(rad) };
  };

  const dataPoints = metrics.map(m => getPoint(m.angle, m.value));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Grid levels
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Label positions (slightly further out)
  const labelRadius = maxRadius + 22;
  const labelPoints = metrics.map(m => {
    const rad = (m.angle - 90) * (Math.PI / 180);
    return { x: centerX + labelRadius * Math.cos(rad), y: centerY + labelRadius * Math.sin(rad) };
  });

  // Score color gradient position (0-100 mapped to gradient bar)
  const getScoreColor = () => {
    if (overallScore >= 70) return "text-success";
    if (overallScore >= 40) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="bg-card border-border p-4 md:p-5">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-semibold text-foreground">Gozlan Score</h3>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-right" side="left">
            <p className="text-xs">ציון משוקלל המבוסס על 6 מדדי ביצוע: Win%, Profit Factor, Avg Win/Loss, Recovery Factor, Max Drawdown, Consistency</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex flex-col items-center">
        <svg width="300" height="260" viewBox="0 0 300 260" className="overflow-visible w-full max-w-[300px]">
          <defs>
            {/* Radar fill gradient */}
            <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
            </linearGradient>
            {/* Score bar gradient */}
            <linearGradient id="scoreBarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(0, 72%, 51%)" />
              <stop offset="25%" stopColor="hsl(25, 95%, 53%)" />
              <stop offset="50%" stopColor="hsl(45, 93%, 47%)" />
              <stop offset="75%" stopColor="hsl(152, 76%, 48%)" />
              <stop offset="100%" stopColor="hsl(189, 94%, 43%)" />
            </linearGradient>
          </defs>

          {/* Grid polygons */}
          {gridLevels.map((level, li) => {
            const pts = metrics.map(m => getPoint(m.angle, level * 100));
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
            return (
              <path
                key={li}
                d={path}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.8"
                opacity={0.15 + li * 0.12}
              />
            );
          })}

          {/* Axis lines */}
          {metrics.map((m, i) => {
            const end = getPoint(m.angle, 100);
            return (
              <line
                key={i}
                x1={centerX} y1={centerY}
                x2={end.x} y2={end.y}
                stroke="hsl(var(--border))"
                strokeWidth="0.8"
                opacity="0.25"
              />
            );
          })}

          {/* Data shape */}
          <path
            d={dataPath}
            fill="url(#radarFill)"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Data points */}
          {dataPoints.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="5" fill="hsl(var(--primary))" opacity="0.15" />
              <circle cx={p.x} cy={p.y} r="3" fill="hsl(var(--primary))" stroke="hsl(var(--card))" strokeWidth="1.5" />
            </g>
          ))}

          {/* Labels */}
          {labelPoints.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: '10px' }}
            >
              {metrics[i].label}
            </text>
          ))}
        </svg>

        {/* Score display */}
        <div className="w-full mt-1 space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-xs text-muted-foreground">Your Gozlan Score</p>
          </div>
          <div className="flex items-center gap-3">
            <p className={`text-2xl font-bold tabular-nums ${getScoreColor()}`}>
              {overallScore.toFixed(2)}
            </p>
            {/* Gradient score bar */}
            <div className="flex-1 relative">
              <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'url(#scoreBarGradient)' }}>
                <svg width="100%" height="100%" className="rounded-full">
                  <rect width="100%" height="100%" fill="url(#scoreBarGradient)" rx="5" />
                </svg>
              </div>
              {/* Score indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-foreground rounded-full shadow-md transition-all duration-500"
                style={{ left: `${Math.min(overallScore, 100)}%` }}
              />
              {/* Scale labels */}
              <div className="flex justify-between mt-1">
                {[0, 20, 40, 60, 80, 100].map(v => (
                  <span key={v} className="text-[8px] text-muted-foreground tabular-nums">{v}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
