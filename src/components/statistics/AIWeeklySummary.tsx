import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb, Trophy, Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Trade, TradeStats } from "@/hooks/useTrades";
import { startOfWeek, endOfWeek } from "date-fns";

interface AISummary {
  summary: string;
  patterns: string[];
  mistakes: string[];
  recommendations: string[];
  grade: string;
  strengths: string[];
  riskAlert: string | null;
}

interface AIWeeklySummaryProps {
  trades: Trade[];
  stats: TradeStats;
}

const gradeColors: Record<string, string> = {
  A: "text-success bg-success/10 border-success/30",
  B: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  C: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  D: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  F: "text-destructive bg-destructive/10 border-destructive/30",
};

export const AIWeeklySummary = ({ trades, stats }: AIWeeklySummaryProps) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter trades to this week
  const weekTrades = trades.filter(t => {
    const d = new Date(t.entry_date || t.created_at);
    const ws = startOfWeek(new Date(), { weekStartsOn: 0 });
    const we = endOfWeek(new Date(), { weekStartsOn: 0 });
    return d >= ws && d <= we;
  });

  const weekStats = {
    totalTrades: weekTrades.length,
    totalPnl: weekTrades.reduce((s, t) => s + (t.pnl || 0), 0),
    winRate: weekTrades.length > 0
      ? (weekTrades.filter(t => (t.pnl || 0) > 0).length / weekTrades.length) * 100
      : 0,
    winningTrades: weekTrades.filter(t => (t.pnl || 0) > 0).length,
    losingTrades: weekTrades.filter(t => (t.pnl || 0) < 0).length,
  };

  const generateSummary = async () => {
    if (weekTrades.length === 0) {
      toast.info("אין עסקאות השבוע לניתוח");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-ai-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ trades: weekTrades, stats: weekStats }),
        }
      );

      if (response.status === 429) {
        toast.error("הגעת למגבלת הבקשות, נסה שוב מאוחר יותר");
        return;
      }
      if (response.status === 402) {
        toast.error("נדרש תשלום, אנא הוסף קרדיטים");
        return;
      }
      if (!response.ok) throw new Error("Failed");

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setSummary(data);
    } catch (error) {
      console.error(error);
      toast.error("שגיאה ביצירת הסיכום");
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <Card className="bg-card border-border p-6 md:p-8" dir="rtl">
        <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">סיכום שבועי AI</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              ה-AI ינתח את העסקאות שלך מהשבוע, יזהה דפוסים וטעויות חוזרות, ויספק המלצות מותאמות אישית לשיפור ביצועים
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {weekTrades.length} עסקאות השבוע
            </Badge>
            <Badge variant="outline" className={`text-xs ${weekStats.totalPnl >= 0 ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
              {weekStats.totalPnl >= 0 ? "+" : ""}${weekStats.totalPnl.toFixed(0)}
            </Badge>
          </div>
          <Button onClick={generateSummary} disabled={loading || weekTrades.length === 0} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "מנתח..." : "צור סיכום שבועי"}
          </Button>
        </div>
      </Card>
    );
  }

  const gc = gradeColors[summary.grade] || gradeColors.C;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with grade */}
      <Card className="bg-card border-border p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">סיכום שבועי AI</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={generateSummary} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              רענן
            </Button>
            <div className={`text-3xl font-black px-3 py-1 rounded-lg border ${gc}`}>
              {summary.grade}
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{summary.summary}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {summary.strengths?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-success" />
              חוזקות
            </h4>
            <ul className="space-y-2">
              {summary.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-success mt-0.5">✓</span>
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Patterns */}
        {summary.patterns?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              דפוסים שזוהו
            </h4>
            <ul className="space-y-2">
              {summary.patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="text-muted-foreground">{p}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Mistakes */}
        {summary.mistakes?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              טעויות חוזרות
            </h4>
            <ul className="space-y-2">
              {summary.mistakes.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-destructive mt-0.5">!</span>
                  <span className="text-muted-foreground">{m}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Recommendations */}
        {summary.recommendations?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              המלצות לשבוע הבא
            </h4>
            <ul className="space-y-2">
              {summary.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-400 mt-0.5">💡</span>
                  <span className="text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Risk Alert */}
      {summary.riskAlert && (
        <Card className="bg-destructive/5 border-destructive/20 p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-destructive mb-1">התרעת סיכון</h4>
              <p className="text-sm text-muted-foreground">{summary.riskAlert}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
