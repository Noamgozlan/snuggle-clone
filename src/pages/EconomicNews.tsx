import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsEvent {
  Name: string;
  Currency: string;
  Category?: string;
  Impact: string;
  Date: string;
  Actual?: number | string | null;
  Forecast?: number | string | null;
  Previous?: number | string | null;
  Outcome?: string;
  Strength?: string;
  Quality?: string;
}

const currencies = ["All", "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "NZD"];
const impacts = ["All", "High", "Medium", "Low"];

const EconomicNews = () => {
  const { t, isRTL } = useLanguage();
  const [period, setPeriod] = useState<"today" | "week">("today");
  const [currency, setCurrency] = useState("All");
  const [impact, setImpact] = useState("All");

  const { data: events, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["economic-news", period, currency, impact],
    queryFn: async () => {
      const body: Record<string, string> = {
        period,
        source: "forex-factory",
      };
      if (currency !== "All") body.currency = currency;
      if (impact !== "All") body.impact = impact;

      const { data, error } = await supabase.functions.invoke("fetch-economic-news", { body });
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as NewsEvent[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const getImpactColor = (imp: string) => {
    switch (imp) {
      case "High": return "bg-destructive/15 text-destructive border-destructive/30";
      case "Medium": return "bg-warning/15 text-warning border-warning/30";
      case "Low": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStrengthIcon = (strength?: string) => {
    if (strength === "Strong Data") return <TrendingUp className="h-4 w-4 text-success" />;
    if (strength === "Weak Data") return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getQualityBadge = (quality?: string) => {
    if (quality === "Good Data") return <Badge variant="outline" className="bg-success/15 text-success border-success/30 text-[10px]">{t("news.good")}</Badge>;
    if (quality === "Bad Data") return <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">{t("news.bad")}</Badge>;
    return null;
  };

  const formatDate = (dateStr: string) => {
    try {
      const cleaned = dateStr.replace(/\./g, "-");
      const date = new Date(cleaned);
      return date.toLocaleTimeString(isRTL ? "he-IL" : "en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const getCurrencyFlag = (cur: string) => {
    const flags: Record<string, string> = {
      USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
      CAD: "🇨🇦", AUD: "🇦🇺", CHF: "🇨🇭", NZD: "🇳🇿",
    };
    return flags[cur] || "🏳️";
  };

  return (
    <DashboardLayout title={t("news.title")}>
      <div className="space-y-4">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Period */}
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant={period === "today" ? "default" : "ghost"}
                  className="text-xs h-8"
                  onClick={() => setPeriod("today")}
                >
                  {t("news.today")}
                </Button>
                <Button
                  size="sm"
                  variant={period === "week" ? "default" : "ghost"}
                  className="text-xs h-8"
                  onClick={() => setPeriod("week")}
                >
                  {t("news.thisWeek")}
                </Button>
              </div>

              {/* Currency filter */}
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === "All" ? t("news.allCurrencies") : `${getCurrencyFlag(c)} ${c}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Impact filter */}
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger className="w-[120px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {impacts.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i === "All" ? t("news.allImpacts") : t(`news.impact${i}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Refresh */}
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 text-xs ms-auto"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
                {t("news.refresh")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-primary" />
              {period === "today" ? t("news.todayEvents") : t("news.weekEvents")}
              {events && <Badge variant="secondary" className="text-[10px]">{events.length}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : !events || events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">{t("news.noEvents")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((event, idx) => (
                  <div
                    key={`${event.Name}-${event.Date}-${idx}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-16 shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatDate(event.Date)}
                    </div>

                    {/* Currency */}
                    <div className="text-sm font-medium w-14 shrink-0">
                      {getCurrencyFlag(event.Currency)} {event.Currency}
                    </div>

                    {/* Impact */}
                    <Badge variant="outline" className={cn("text-[10px] w-16 justify-center shrink-0", getImpactColor(event.Impact))}>
                      {event.Impact}
                    </Badge>

                    {/* Event name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.Name}</p>
                      {event.Category && (
                        <p className="text-[11px] text-muted-foreground truncate">{event.Category}</p>
                      )}
                    </div>

                    {/* Values */}
                    <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
                      <div className="text-center w-16">
                        <p className="text-[10px] text-muted-foreground">{t("news.actual")}</p>
                        <p className="font-semibold">{event.Actual ?? "—"}</p>
                      </div>
                      <div className="text-center w-16">
                        <p className="text-[10px] text-muted-foreground">{t("news.forecast")}</p>
                        <p className="font-medium">{event.Forecast ?? "—"}</p>
                      </div>
                      <div className="text-center w-16">
                        <p className="text-[10px] text-muted-foreground">{t("news.previous")}</p>
                        <p className="text-muted-foreground">{event.Previous ?? "—"}</p>
                      </div>
                    </div>

                    {/* Strength & Quality */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                      {getStrengthIcon(event.Strength)}
                      {getQualityBadge(event.Quality)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EconomicNews;
