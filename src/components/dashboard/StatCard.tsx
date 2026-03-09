import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon?: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  className,
}: StatCardProps) => {
  const trendColors = {
    up: "text-success",
    down: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-[0_0_20px_hsl(var(--primary)/0.05)]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p
            className={cn(
              "text-xl font-bold tabular-nums tracking-tight",
              trend ? trendColors[trend] : "text-foreground"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-1.5 bg-primary/8 rounded-md">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};
