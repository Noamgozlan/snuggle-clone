import { useMemo } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Trade } from "@/hooks/useTrades";
import { useState } from "react";
import { startOfWeek, endOfWeek } from "date-fns";

interface RecurringMistakesBannerProps {
  trades: Trade[];
}

export const RecurringMistakesBanner = ({ trades }: RecurringMistakesBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  const recurringMistake = useMemo(() => {
    // Look at last 2 weeks of trades
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const recentTrades = trades.filter(t => {
      const d = new Date(t.entry_date || t.created_at);
      return d >= twoWeeksAgo;
    });

    // Count mistakes
    const mistakeCounts: Record<string, number> = {};
    recentTrades.forEach(t => {
      const mistakes = (t as any).mistakes as string[] | null;
      if (!mistakes) return;
      mistakes.forEach(m => {
        mistakeCounts[m] = (mistakeCounts[m] || 0) + 1;
      });
    });

    // Find most recurring mistake (at least 3 occurrences)
    const sorted = Object.entries(mistakeCounts)
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length > 0 && sorted[0][1] >= 3) {
      return { name: sorted[0][0], count: sorted[0][1] };
    }

    return null;
  }, [trades]);

  if (!recurringMistake || dismissed) return null;

  return (
    <div className="relative bg-destructive/10 border border-destructive/20 rounded-lg p-3 md:p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          ⚠️ טעות חוזרת זוהתה: <span className="text-destructive font-semibold">{recurringMistake.name}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          הטעות הזו חזרה {recurringMistake.count} פעמים בשבועיים האחרונים. שים לב לדפוס הזה במסחר הבא שלך.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
};
