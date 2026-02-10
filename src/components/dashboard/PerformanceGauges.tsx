import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GaugeProps {
  label: string;
  value: number;
  tooltip: string;
  wins: number;
  breakeven: number;
  losses: number;
  isRatio?: boolean;
}

const SemiCircleGauge = ({ label, value, tooltip, wins, breakeven, losses, isRatio }: GaugeProps) => {
  const total = wins + breakeven + losses;
  const winPercent = total > 0 ? (wins / total) * 100 : 0;
  
  // SVG semi-circle gauge
  const radius = 52;
  const strokeWidth = 10;
  const cx = 65;
  const cy = 60;
  const circumference = Math.PI * radius; // half circle
  
  const winArc = (winPercent / 100) * circumference;
  const lossArc = circumference - winArc;

  return (
    <div className="flex flex-col items-center">
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-48">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Gauge */}
      <div className="relative w-[130px] h-[72px]">
        <svg viewBox="0 0 130 72" className="w-full h-full">
          {/* Background arc (losses - red) */}
          <path
            d={describeArc(cx, cy, radius, 180, 360)}
            fill="none"
            stroke="hsl(0 84% 60% / 0.3)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Win arc (green) */}
          {winPercent > 0 && (
            <path
              d={describeArc(cx, cy, radius, 180, 180 + (winPercent / 100) * 180)}
              fill="none"
              stroke="hsl(142 71% 45%)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
          {/* Loss arc over remaining portion */}
          {winPercent < 100 && (
            <path
              d={describeArc(cx, cy, radius, 180 + (winPercent / 100) * 180, 360)}
              fill="none"
              stroke="hsl(0 84% 60%)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}
        </svg>
        {/* Center value */}
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          <span className="text-lg font-bold text-foreground">
            {isRatio ? value.toFixed(2) : `${value.toFixed(2)}%`}
          </span>
        </div>
      </div>

      {/* Data pills */}
      <div className="flex items-center gap-2 mt-2">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success/15 text-success">
          {wins}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">
          {breakeven}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-destructive/15 text-destructive">
          {losses}
        </span>
      </div>
    </div>
  );
};

/** Compact inline semi-circle gauge for stat cards */
export const MiniGauge = ({ wins, breakeven, losses }: { wins: number; breakeven: number; losses: number }) => {
  const total = wins + breakeven + losses;
  const winPct = total > 0 ? wins / total : 0;
  const bePct = total > 0 ? breakeven / total : 0;

  const r = 20;
  const sw = 5;
  const cx = 26;
  const cy = 24;
  const half = Math.PI * r;

  const winEnd = 180 + winPct * 180;
  const beEnd = winEnd + bePct * 180;

  return (
    <svg viewBox="0 0 52 28" className="w-12 h-7 flex-shrink-0">
      {/* bg */}
      <path d={describeArc(cx, cy, r, 180, 360)} fill="none" stroke="hsl(0 84% 60% / 0.35)" strokeWidth={sw} />
      {/* breakeven */}
      {bePct > 0 && (
        <path d={describeArc(cx, cy, r, winEnd, beEnd)} fill="none" stroke="hsl(45 93% 47%)" strokeWidth={sw} />
      )}
      {/* wins */}
      {winPct > 0 && (
        <path d={describeArc(cx, cy, r, 180, winEnd)} fill="none" stroke="hsl(142 71% 45%)" strokeWidth={sw} />
      )}
      {/* losses fill remaining */}
      {(winPct + bePct) < 1 && (
        <path d={describeArc(cx, cy, r, beEnd, 360)} fill="none" stroke="hsl(0 84% 60%)" strokeWidth={sw} />
      )}
    </svg>
  );
};

// Helper: SVG arc path
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

interface AvgWinLossBarProps {
  avgWin: number;
  avgLoss: number;
  ratio: number;
}

const AvgWinLossBar = ({ avgWin, avgLoss, ratio }: AvgWinLossBarProps) => {
  const absLoss = Math.abs(avgLoss);
  const total = avgWin + absLoss;
  const winPct = total > 0 ? (avgWin / total) * 100 : 50;

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-medium text-muted-foreground">Avg win/loss trade</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-48">
            יחס בין ממוצע רווח לממוצע הפסד
          </TooltipContent>
        </Tooltip>
      </div>
      
      <span className="text-lg font-bold text-foreground mb-2">{ratio.toFixed(2)}</span>

      {/* Progress bar */}
      <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-muted">
        <div
          className="h-full rounded-r-full transition-all"
          style={{ width: `${winPct}%`, backgroundColor: 'hsl(142 71% 45%)' }}
        />
        <div
          className="h-full rounded-l-full transition-all"
          style={{ width: `${100 - winPct}%`, backgroundColor: 'hsl(0 84% 60%)' }}
        />
      </div>

      {/* Values */}
      <div className="flex items-center justify-between w-full mt-1.5">
        <span className="text-[11px] font-semibold text-success">
          ${avgWin.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
        <span className="text-[11px] font-semibold text-destructive">
          -${absLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
};

interface PerformanceGaugesProps {
  winRate: number;
  profitFactor: number;
  dayWinPercent: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winningDays: number;
  losingDays: number;
  breakevenDays: number;
  avgWin: number;
  avgLoss: number;
}

export const PerformanceGauges = ({
  winRate,
  profitFactor,
  dayWinPercent,
  winningTrades,
  losingTrades,
  breakevenTrades,
  winningDays,
  losingDays,
  breakevenDays,
  avgWin,
  avgLoss,
}: PerformanceGaugesProps) => {
  const absLoss = Math.abs(avgLoss);
  const avgRatio = absLoss > 0 ? avgWin / absLoss : avgWin > 0 ? Infinity : 0;

  return (
    <Card className="bg-card border-border p-4 md:p-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <SemiCircleGauge
          label="Trade Win %"
          value={winRate}
          tooltip="אחוז עסקאות מנצחות מתוך סך כל העסקאות"
          wins={winningTrades}
          breakeven={breakevenTrades}
          losses={losingTrades}
        />
        <SemiCircleGauge
          label="Profit Factor"
          value={profitFactor === Infinity ? 999 : profitFactor}
          tooltip="יחס רווח גולמי להפסד גולמי"
          wins={winningTrades}
          breakeven={breakevenTrades}
          losses={losingTrades}
          isRatio
        />
        <SemiCircleGauge
          label="Day Win %"
          value={dayWinPercent}
          tooltip="אחוז ימי מסחר רווחיים"
          wins={winningDays}
          breakeven={breakevenDays}
          losses={losingDays}
        />
        <AvgWinLossBar
          avgWin={avgWin}
          avgLoss={avgLoss}
          ratio={isFinite(avgRatio) ? avgRatio : 0}
        />
      </div>
    </Card>
  );
};
