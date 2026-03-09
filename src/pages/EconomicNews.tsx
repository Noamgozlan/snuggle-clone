import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, RefreshCw, AlertTriangle, Clock, TrendingUp, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";

interface EconomicEvent {
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: "high" | "medium" | "low";
  forecast?: string;
  previous?: string;
  actual?: string;
}

const IMPACT_CONFIG = {
  high: { label: "High", className: "bg-destructive/15 text-destructive border-destructive/30" },
  medium: { label: "Med", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  low: { label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

const CURRENCY_COLORS: Record<string, string> = {
  USD: "bg-blue-500/15 text-blue-400",
  EUR: "bg-indigo-500/15 text-indigo-400",
  GBP: "bg-purple-500/15 text-purple-400",
  JPY: "bg-red-500/15 text-red-400",
  AUD: "bg-green-500/15 text-green-400",
  CAD: "bg-orange-500/15 text-orange-400",
  CHF: "bg-cyan-500/15 text-cyan-400",
  NZD: "bg-teal-500/15 text-teal-400",
  CNY: "bg-amber-500/15 text-amber-400",
};

const EconomicNews = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const from = format(today, "yyyy-MM-dd");
      const to = format(addDays(today, 7), "yyyy-MM-dd");

      const { data, error: fnError } = await supabase.functions.invoke("scrape-economic-calendar", {
        body: { from, to, countries: "US,EU,GB,JP,AU,CA,CH,NZ" },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || "Failed to fetch events");

      setEvents(data.events || []);
    } catch (err: any) {
      console.error("Error fetching economic events:", err);
      setError(err.message || "Failed to load economic calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (impactFilter !== "all" && e.impact !== impactFilter) return false;
      if (currencyFilter !== "all" && e.currency !== currencyFilter) return false;
      return true;
    });
  }, [events, impactFilter, currencyFilter]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, EconomicEvent[]> = {};
    filteredEvents.forEach((e) => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return groups;
  }, [filteredEvents]);

  const currencies = useMemo(() => {
    const set = new Set(events.map((e) => e.currency));
    return Array.from(set).sort();
  }, [events]);

  const formatDateHeader = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T00:00:00");
      const today = new Date();
      const todayStr = format(today, "yyyy-MM-dd");
      const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd");
      if (dateStr === todayStr) return `Today — ${format(d, "EEEE, MMM d")}`;
      if (dateStr === tomorrowStr) return `Tomorrow — ${format(d, "EEEE, MMM d")}`;
      return format(d, "EEEE, MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout title={t("news.title")}>
      <div className="w-full max-w-6xl mx-auto px-0 md:px-4 space-y-4">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Economic Calendar</h2>
              <p className="text-xs text-muted-foreground">Next 7 days • Live data</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={impactFilter} onValueChange={setImpactFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Impact</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-[120px] h-9 text-xs">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-sm font-medium text-destructive">Failed to load events</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={fetchEvents}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        )}

        {/* Events grouped by date */}
        {!loading && !error && Object.keys(groupedEvents).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No economic events found for the selected filters.</p>
            </CardContent>
          </Card>
        )}

        {!loading && Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <Card key={date} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30 border-b border-border">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDateHeader(date)}
                <Badge variant="secondary" className="ml-auto text-xs">{dateEvents.length} events</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[70px_60px_1fr_70px_80px_80px_80px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border bg-muted/10">
                <span>Time</span>
                <span>Ccy</span>
                <span>Event</span>
                <span>Impact</span>
                <span className="text-right">Actual</span>
                <span className="text-right">Forecast</span>
                <span className="text-right">Previous</span>
              </div>
              {dateEvents.map((event, idx) => (
                <div
                  key={`${event.date}-${event.time}-${event.title}-${idx}`}
                  className={`grid grid-cols-1 md:grid-cols-[70px_60px_1fr_70px_80px_80px_80px] gap-1 md:gap-2 px-4 py-3 items-center border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors ${
                    event.impact === "high" ? "border-l-2 border-l-destructive" : ""
                  }`}
                >
                  {/* Time */}
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3 md:hidden" />
                    {event.time}
                  </span>
                  {/* Currency */}
                  <Badge variant="outline" className={`text-xs w-fit ${CURRENCY_COLORS[event.currency] || "bg-muted text-muted-foreground"}`}>
                    {event.currency}
                  </Badge>
                  {/* Title */}
                  <span className="text-sm font-medium text-foreground truncate">{event.title}</span>
                  {/* Impact */}
                  <Badge variant="outline" className={`text-xs w-fit ${IMPACT_CONFIG[event.impact].className}`}>
                    {IMPACT_CONFIG[event.impact].label}
                  </Badge>
                  {/* Actual */}
                  <span className={`text-xs text-right font-mono ${event.actual ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                    {event.actual || "—"}
                  </span>
                  {/* Forecast */}
                  <span className="text-xs text-right font-mono text-muted-foreground">
                    {event.forecast || "—"}
                  </span>
                  {/* Previous */}
                  <span className="text-xs text-right font-mono text-muted-foreground">
                    {event.previous || "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Stats footer */}
        {!loading && events.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {filteredEvents.length} of {events.length} events shown
            </span>
            <span>Data from Ultimate Economic Calendar</span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EconomicNews;
