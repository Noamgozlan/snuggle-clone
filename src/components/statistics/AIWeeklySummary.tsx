import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Lightbulb, Trophy, Shield, RefreshCw, CalendarIcon, ThumbsUp, ThumbsDown, Brain } from "lucide-react";
import { toast } from "sonner";
import { Trade, TradeStats } from "@/hooks/useTrades";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AISummary {
  summary: string;
  patterns: string[];
  mistakes: string[];
  recommendations: string[];
  grade: string;
  strengths: string[];
  riskAlert: string | null;
  textPatterns?: {
    goodPoints: string[];
    badPoints: string[];
    insights: string[];
  };
}

interface AIWeeklySummaryProps {
  trades: Trade[];
  stats: TradeStats;
}

type PeriodType = "week" | "month" | "all" | "custom";

const gradeColors: Record<string, string> = {
  A: "text-success bg-success/10 border-success/30",
  B: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  C: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  D: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  F: "text-destructive bg-destructive/10 border-destructive/30",
};

export const AIWeeklySummary = ({ trades }: AIWeeklySummaryProps) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodType>("week");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const { filteredTrades, rangeLabel } = useMemo(() => {
    const now = new Date();
    let from: Date | null = null;
    let to: Date | null = null;
    let label = "";

    if (period === "week") {
      from = startOfWeek(now, { weekStartsOn: 0 });
      to = endOfWeek(now, { weekStartsOn: 0 });
      label = "השבוע";
    } else if (period === "month") {
      from = startOfMonth(now);
      to = endOfMonth(now);
      label = "החודש";
    } else if (period === "all") {
      label = "כל העסקאות";
    } else if (period === "custom" && customFrom && customTo) {
      from = customFrom;
      to = new Date(customTo.getTime() + 24 * 60 * 60 * 1000 - 1);
      label = `${format(from, "dd/MM/yy", { locale: he })} - ${format(customTo, "dd/MM/yy", { locale: he })}`;
    }

    const filtered = trades.filter(t => {
      if (!from || !to) return period === "all";
      const d = new Date(t.entry_date || t.created_at);
      return d >= from && d <= to;
    });

    return { filteredTrades: filtered, rangeLabel: label };
  }, [trades, period, customFrom, customTo]);

  const periodStats = useMemo(() => ({
    totalTrades: filteredTrades.length,
    totalPnl: filteredTrades.reduce((s, t) => s + (t.pnl || 0), 0),
    winRate: filteredTrades.length > 0
      ? (filteredTrades.filter(t => (t.pnl || 0) > 0).length / filteredTrades.length) * 100
      : 0,
    winningTrades: filteredTrades.filter(t => (t.pnl || 0) > 0).length,
    losingTrades: filteredTrades.filter(t => (t.pnl || 0) < 0).length,
  }), [filteredTrades]);

  const generateSummary = async () => {
    if (filteredTrades.length === 0) {
      toast.info("אין עסקאות בטווח הנבחר לניתוח");
      return;
    }
    if (period === "custom" && (!customFrom || !customTo)) {
      toast.info("בחר טווח תאריכים");
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
          body: JSON.stringify({ trades: filteredTrades, stats: periodStats, periodLabel: rangeLabel }),
        }
      );

      if (response.status === 429) { toast.error("הגעת למגבלת הבקשות, נסה שוב מאוחר יותר"); return; }
      if (response.status === 402) { toast.error("נדרש תשלום, אנא הוסף קרדיטים"); return; }
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

  const PeriodSelector = () => (
    <div className="flex flex-wrap items-center gap-2">
      {([
        { k: "week", l: "שבועי" },
        { k: "month", l: "חודשי" },
        { k: "all", l: "כל העסקאות" },
        { k: "custom", l: "טווח מותאם" },
      ] as { k: PeriodType; l: string }[]).map(({ k, l }) => (
        <Button
          key={k}
          type="button"
          variant={period === k ? "default" : "outline"}
          size="sm"
          onClick={() => setPeriod(k)}
        >
          {l}
        </Button>
      ))}
      {period === "custom" && (
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-1.5", !customFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customFrom ? format(customFrom, "dd/MM/yy", { locale: he }) : "מתאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-1.5", !customTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customTo ? format(customTo, "dd/MM/yy", { locale: he }) : "עד תאריך"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );

  if (!summary) {
    return (
      <Card className="bg-card border-border p-6 md:p-8" dir="rtl">
        <div className="flex flex-col items-center justify-center text-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">סיכום AI חכם</h3>
            <p className="text-sm text-muted-foreground max-w-lg">
              בחר טווח זמן וה-AI ינתח את העסקאות שלך, יזהה דפוסים בסיבות הכניסה ובמסקנות שכתבת, ויציג נקודות טובות וחלשות
            </p>
          </div>
          <PeriodSelector />
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {filteredTrades.length} עסקאות {rangeLabel && `(${rangeLabel})`}
            </Badge>
            <Badge variant="outline" className={`text-xs ${periodStats.totalPnl >= 0 ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
              {periodStats.totalPnl >= 0 ? "+" : ""}${periodStats.totalPnl.toFixed(0)}
            </Badge>
          </div>
          <Button onClick={generateSummary} disabled={loading || filteredTrades.length === 0} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "מנתח..." : "צור סיכום AI"}
          </Button>
        </div>
      </Card>
    );
  }

  const gc = gradeColors[summary.grade] || gradeColors.C;

  return (
    <div className="space-y-4" dir="rtl">
      <Card className="bg-card border-border p-5">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">סיכום AI</h3>
              <p className="text-xs text-muted-foreground">{rangeLabel} · {filteredTrades.length} עסקאות</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSummary(null)} className="gap-1.5">
              שנה טווח
            </Button>
            <Button variant="ghost" size="sm" onClick={generateSummary} disabled={loading} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              רענן
            </Button>
            <div className={`text-3xl font-black px-3 py-1 rounded-lg border ${gc}`}>{summary.grade}</div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{summary.summary}</p>
      </Card>

      {/* Text pattern analysis (entry reasons + conclusions) */}
      {summary.textPatterns && (
        <Card className="bg-card border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">ניתוח סיבות הכניסה והמסקנות שלך</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.textPatterns.goodPoints?.length > 0 && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                <h5 className="text-sm font-semibold flex items-center gap-2 text-success mb-2">
                  <ThumbsUp className="h-4 w-4" /> נקודות טובות
                </h5>
                <ul className="space-y-1.5">
                  {summary.textPatterns.goodPoints.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-success">+</span>{p}</li>
                  ))}
                </ul>
              </div>
            )}
            {summary.textPatterns.badPoints?.length > 0 && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <h5 className="text-sm font-semibold flex items-center gap-2 text-destructive mb-2">
                  <ThumbsDown className="h-4 w-4" /> נקודות לשיפור
                </h5>
                <ul className="space-y-1.5">
                  {summary.textPatterns.badPoints.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-destructive">−</span>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {summary.textPatterns.insights?.length > 0 && (
            <div className="mt-3 bg-primary/5 border border-primary/20 rounded-lg p-3">
              <h5 className="text-sm font-semibold text-primary mb-2">תובנות מהטקסט שלך</h5>
              <ul className="space-y-1.5">
                {summary.textPatterns.insights.map((p, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary">•</span>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summary.strengths?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3"><Trophy className="h-4 w-4 text-success" />חוזקות</h4>
            <ul className="space-y-2">
              {summary.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><span className="text-success mt-0.5">✓</span><span className="text-muted-foreground">{s}</span></li>
              ))}
            </ul>
          </Card>
        )}
        {summary.patterns?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-primary" />דפוסים שזוהו</h4>
            <ul className="space-y-2">
              {summary.patterns.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><span className="text-primary mt-0.5">•</span><span className="text-muted-foreground">{p}</span></li>
              ))}
            </ul>
          </Card>
        )}
        {summary.mistakes?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3"><AlertTriangle className="h-4 w-4 text-destructive" />טעויות חוזרות</h4>
            <ul className="space-y-2">
              {summary.mistakes.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><span className="text-destructive mt-0.5">!</span><span className="text-muted-foreground">{m}</span></li>
              ))}
            </ul>
          </Card>
        )}
        {summary.recommendations?.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3"><Lightbulb className="h-4 w-4 text-yellow-400" />המלצות להמשך</h4>
            <ul className="space-y-2">
              {summary.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm"><span className="text-yellow-400 mt-0.5">💡</span><span className="text-muted-foreground">{r}</span></li>
              ))}
            </ul>
          </Card>
        )}
      </div>

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
