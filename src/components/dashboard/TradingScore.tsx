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
}

export const TradingScore = ({ winRate, avgRR, avgWinLossRatio }: TradingScoreProps) => {
  // Normalize values to 0-100 scale for the radar chart
  const normalizedValues = useMemo(() => {
    return {
      winRate: Math.min(winRate, 100),
      avgRR: Math.min((avgRR / 3) * 100, 100), // 3.0 = 100%
      avgWinLoss: Math.min((avgWinLossRatio / 3) * 100, 100), // 3.0 = 100%
    };
  }, [winRate, avgRR, avgWinLossRatio]);

  // Calculate overall score (weighted average)
  const overallScore = useMemo(() => {
    const score = (
      normalizedValues.winRate * 0.35 +
      normalizedValues.avgRR * 0.35 +
      normalizedValues.avgWinLoss * 0.30
    );
    return Math.min(score, 100);
  }, [normalizedValues]);

  // Triangle radar chart calculations
  const centerX = 100;
  const centerY = 90;
  const maxRadius = 65;

  // Three points at 120 degree intervals (top, bottom-left, bottom-right)
  const getPoint = (angle: number, value: number) => {
    const normalizedValue = value / 100;
    const radius = maxRadius * normalizedValue;
    const angleRad = (angle - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angleRad),
      y: centerY + radius * Math.sin(angleRad),
    };
  };

  const points = [
    getPoint(0, normalizedValues.winRate),      // Top
    getPoint(240, normalizedValues.avgWinLoss), // Bottom-left
    getPoint(120, normalizedValues.avgRR), // Bottom-right
  ];

  const maxPoints = [
    getPoint(0, 100),
    getPoint(240, 100),
    getPoint(120, 100),
  ];

  const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} Z`;
  const maxPathData = `M ${maxPoints[0].x} ${maxPoints[0].y} L ${maxPoints[1].x} ${maxPoints[1].y} L ${maxPoints[2].x} ${maxPoints[2].y} Z`;

  const getScoreColor = () => {
    if (overallScore >= 70) return "text-success";
    if (overallScore >= 40) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="bg-card/50 border-border/50 p-5">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold text-foreground">Gozlan Score</h3>
        <Tooltip>
          <TooltipTrigger>
            <Info className="h-4 w-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-right" side="left">
            <p>ציון משוקלל המבוסס על אחוז הצלחה (35%), Avg RR (35%), ויחס ממוצע רווח/הפסד (30%)</p>
          </TooltipContent>
        </Tooltip>
        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full mr-auto">BETA</span>
      </div>

      <div className="flex flex-col items-center">
        <svg width="200" height="160" viewBox="0 0 200 160" className="overflow-visible">
          {/* Grid lines */}
          {[0.33, 0.66, 1].map((scale, i) => {
            const gridPoints = [
              getPoint(0, scale * 100),
              getPoint(240, scale * 100),
              getPoint(120, scale * 100),
            ];
            return (
              <path
                key={i}
                d={`M ${gridPoints[0].x} ${gridPoints[0].y} L ${gridPoints[1].x} ${gridPoints[1].y} L ${gridPoints[2].x} ${gridPoints[2].y} Z`}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity={0.3 + i * 0.2}
              />
            );
          })}

          {/* Axis lines from center */}
          {[0, 120, 240].map((angle, i) => {
            const endPoint = getPoint(angle, 100);
            return (
              <line
                key={i}
                x1={centerX}
                y1={centerY}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Value area */}
          <path
            d={pathData}
            fill="url(#scoreGradient)"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="transition-all duration-500"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--background))"
              strokeWidth="2"
            />
          ))}

          {/* Labels */}
          <text x={centerX} y="12" textAnchor="middle" className="fill-muted-foreground text-xs">
            Win %
          </text>
          <text x="30" y="145" textAnchor="middle" className="fill-muted-foreground text-xs">
            Avg win/loss
          </text>
          <text x="170" y="145" textAnchor="middle" className="fill-muted-foreground text-xs">
            Avg RR
          </text>
        </svg>

        {/* Score display */}
        <div className="text-center mt-2">
          <p className="text-sm text-muted-foreground">Your Gozlan Score:</p>
          <p className={`text-3xl font-bold ${getScoreColor()}`}>
            {overallScore.toFixed(2)}
          </p>
        </div>
      </div>
    </Card>
  );
};
