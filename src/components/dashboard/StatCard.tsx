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
        "bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p
            className={cn(
              "text-2xl font-bold",
              trend ? trendColors[trend] : "text-foreground"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
};
