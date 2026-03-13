import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Grid3X3 } from "lucide-react";
import { Trade } from "@/hooks/useTrades";
import { getHours, getDay, format } from "date-fns";

interface TradingHeatmapProps {
  trades: Trade[];
}

export const TradingHeatmap = ({ trades }: TradingHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const dayLabels = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
    
    // Matrix: day (0-6) × hour (0-23)
    const matrix: Record<string, { pnl: number; count: number; wins: number }> = {};
    
    trades.filter(t => t.entry_date && t.pnl !== null).forEach(trade => {
      const d = new Date(trade.entry_date!);
      const day = getDay(d);
      const hour = getHours(d);
      const key = `${day}-${hour}`;
      if (!matrix[key]) matrix[key] = { pnl: 0, count: 0, wins: 0 };
      matrix[key].pnl += trade.pnl || 0;
      matrix[key].count++;
      if ((trade.pnl || 0) > 0) matrix[key].wins++;
    });

    // Find max absolute PnL for color scaling
    const allPnls = Object.values(matrix).map(v => Math.abs(v.pnl));
    const maxAbs = Math.max(...allPnls, 1);

    return { dayLabels, hourLabels, matrix, maxAbs };
  }, [trades]);

  const getColor = (pnl: number, maxAbs: number) => {
    if (pnl === 0) return "bg-muted/30";
    const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
    if (pnl > 0) {
      if (intensity > 0.7) return "bg-success/80";
      if (intensity > 0.4) return "bg-success/50";
      return "bg-success/25";
    } else {
      if (intensity > 0.7) return "bg-destructive/80";
      if (intensity > 0.4) return "bg-destructive/50";
      return "bg-destructive/25";
    }
  };

  // Only show hours that have trades (to keep it compact)
  const activeHours = useMemo(() => {
    const hours = new Set<number>();
    trades.filter(t => t.entry_date).forEach(t => {
      hours.add(getHours(new Date(t.entry_date!)));
    });
    return Array.from(hours).sort((a, b) => a - b);
  }, [trades]);

  if (trades.filter(t => t.entry_date).length === 0) return null;

  return (
    <Card className="bg-card border-border p-4 md:p-5">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
        <Grid3X3 className="h-4 w-4 text-primary" />
        Heatmap שעות מסחר
      </h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header row - hours */}
          <div className="flex gap-0.5 mb-0.5 ps-10">
            {activeHours.map(hour => (
              <div key={hour} className="flex-1 min-w-[28px] text-center">
                <span className="text-[9px] text-muted-foreground">{hour}</span>
              </div>
            ))}
          </div>

          {/* Data rows - days */}
          {heatmapData.dayLabels.map((dayLabel, dayIndex) => (
            <div key={dayIndex} className="flex gap-0.5 mb-0.5 items-center">
              <span className="text-[10px] text-muted-foreground w-10 text-end pe-2 shrink-0">{dayLabel}</span>
              {activeHours.map(hour => {
                const key = `${dayIndex}-${hour}`;
                const cell = heatmapData.matrix[key];
                
                return (
                  <UITooltip key={hour}>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 min-w-[28px] aspect-square rounded-sm transition-all cursor-default ${
                          cell ? getColor(cell.pnl, heatmapData.maxAbs) : "bg-muted/10"
                        } hover:ring-1 hover:ring-primary/50`}
                      />
                    </TooltipTrigger>
                    {cell && (
                      <TooltipContent side="top" className="text-xs">
                        <p className="font-semibold">{dayLabel} · {hour}:00</p>
                        <p className={cell.pnl >= 0 ? "text-success" : "text-destructive"}>
                          ${cell.pnl.toFixed(2)}
                        </p>
                        <p className="text-muted-foreground">
                          {cell.count} עסקאות · {cell.count > 0 ? Math.round((cell.wins / cell.count) * 100) : 0}% הצלחה
                        </p>
                      </TooltipContent>
                    )}
                  </UITooltip>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <span className="text-[10px] text-muted-foreground">הפסד</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-destructive/80" />
          <div className="w-3 h-3 rounded-sm bg-destructive/50" />
          <div className="w-3 h-3 rounded-sm bg-destructive/25" />
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <div className="w-3 h-3 rounded-sm bg-success/25" />
          <div className="w-3 h-3 rounded-sm bg-success/50" />
          <div className="w-3 h-3 rounded-sm bg-success/80" />
        </div>
        <span className="text-[10px] text-muted-foreground">רווח</span>
      </div>
    </Card>
  );
};
