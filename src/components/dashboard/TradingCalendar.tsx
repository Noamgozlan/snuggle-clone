import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, BookOpen, ChevronDown, ChevronUp, Star, Target, CheckCircle2, FileText, Brain, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DailyNoteDialog } from "./DailyNoteDialog";
import { useDailyNotes } from "@/hooks/useDailyNotes";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  subDays,
} from "date-fns";
import { he } from "date-fns/locale";

interface Trade {
  id: string;
  pnl: number | null;
  pnl_points?: number | null;
  entry_date: string | null;
  created_at: string;
  symbol: string;
  trade_type: string;
  quantity?: number;
  entry_price?: number;
  exit_price?: number | null;
  strategy?: string | null;
  screenshot_url?: string | null;
  notes?: string | null;
  rating?: number | null;
  rr?: number | null;
  risk?: number | null;
  mental_state?: string | null;
  mistakes?: string[] | null;
  setup_type?: string | null;
}

interface TradingCalendarProps {
  trades: Trade[];
  displayMode?: "money" | "points" | "percentage" | "balance";
  portfolioBalance?: number;
}

const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const hebrewMonths = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export const TradingCalendar = ({ trades, displayMode = "money", portfolioBalance = 0 }: TradingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [noteDate, setNoteDate] = useState("");
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const { getNoteForDate, getDatesWithNotes, upsertNote } = useDailyNotes();
  const datesWithNotes = getDatesWithNotes();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Get trades grouped by date with full trade data
  const tradesByDate = useMemo(() => {
    const grouped: Record<string, { pnl: number; points: number; count: number; trades: Trade[] }> = {};

    trades.forEach((trade) => {
      const dateStr = trade.entry_date
        ? format(new Date(trade.entry_date), "yyyy-MM-dd")
        : format(new Date(trade.created_at), "yyyy-MM-dd");

      if (!grouped[dateStr]) {
        grouped[dateStr] = { pnl: 0, points: 0, count: 0, trades: [] };
      }
      grouped[dateStr].pnl += trade.pnl || 0;
      grouped[dateStr].points += trade.pnl_points || 0;
      grouped[dateStr].count += 1;
      grouped[dateStr].trades.push(trade);
    });

    return grouped;
  }, [trades]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let totalPnl = 0;
    let totalPoints = 0;
    let tradingDays = 0;

    Object.entries(tradesByDate).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (isSameMonth(date, currentDate)) {
        totalPnl += data.pnl;
        totalPoints += data.points;
        tradingDays += 1;
      }
    });

    return { totalPnl, totalPoints, tradingDays };
  }, [tradesByDate, currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const paddingCount = getDay(monthStart);
    const paddingDays =
      paddingCount > 0
        ? eachDayOfInterval({
            start: subDays(monthStart, paddingCount),
            end: subDays(monthStart, 1),
          })
        : [];

    return [...paddingDays, ...days];
  }, [monthStart, monthEnd]);

  // Group by weeks for the sidebar
  const weeklyData = useMemo(() => {
    const weeks: { weekNum: number; pnl: number; points: number; days: number }[] = [];
    let currentWeek = 1;
    let weekPnl = 0;
    let weekPoints = 0;
    let weekDays = 0;

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    days.forEach((day, index) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayData = tradesByDate[dateStr];

      if (dayData) {
        weekPnl += dayData.pnl;
        weekPoints += dayData.points;
        weekDays += 1;
      }

      if ((index + getDay(monthStart) + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push({ weekNum: currentWeek, pnl: weekPnl, points: weekPoints, days: weekDays });
        currentWeek += 1;
        weekPnl = 0;
        weekPoints = 0;
        weekDays = 0;
      }
    });

    return weeks;
  }, [monthStart, monthEnd, tradesByDate]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDayClick = (dateStr: string) => {
    const dayData = tradesByDate[dateStr];
    if (dayData && dayData.trades.length > 0) {
      setSelectedDate(dateStr);
      setIsDialogOpen(true);
    } else {
      // Open note dialog for days without trades
      setNoteDate(dateStr);
      setIsNoteDialogOpen(true);
    }
  };

  const handleOpenNote = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteDate(dateStr);
    setIsNoteDialogOpen(true);
  };

  const selectedDayTrades = selectedDate ? tradesByDate[selectedDate]?.trades || [] : [];

  // Format value based on display mode
  const formatValue = (pnl: number, points: number) => {
    switch (displayMode) {
      case "points":
        return `${points >= 0 ? '' : ''}${points.toFixed(1)}`;
      case "percentage":
        const percentage = portfolioBalance > 0 ? (pnl / portfolioBalance) * 100 : 0;
        return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
      case "balance":
        return `$${(portfolioBalance + pnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      default:
        return `$${pnl.toFixed(0)}`;
    }
  };

  const formatMonthlyStats = () => {
    switch (displayMode) {
      case "points":
        return `${monthlyStats.totalPoints.toFixed(1)} נק׳`;
      case "percentage":
        const percentage = portfolioBalance > 0 ? (monthlyStats.totalPnl / portfolioBalance) * 100 : 0;
        return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
      case "balance":
        return `$${(portfolioBalance + monthlyStats.totalPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      default:
        return `$${monthlyStats.totalPnl.toFixed(0)}`;
    }
  };

  const formatWeeklyValue = (pnl: number, points: number) => {
    switch (displayMode) {
      case "points":
        return `${points.toFixed(0)} נק׳`;
      case "percentage":
        const percentage = portfolioBalance > 0 ? (pnl / portfolioBalance) * 100 : 0;
        return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
      case "balance":
        return `$${pnl.toFixed(0)}`;
      default:
        return `$${pnl.toFixed(0)}`;
    }
  };

  return (
    <>
      <Card className="bg-card border-border p-3 md:p-4 hover-glow overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="hover:scale-110 transition-transform h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-center min-w-0">
            <h3 className="font-bold text-base md:text-lg">
              {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              חודשי: {formatMonthlyStats()}, {monthlyStats.tradingDays} יום
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="hover:scale-110 transition-transform h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Calendar Grid with Weekly Sidebar */}
        <div className="flex gap-2">
          {/* Weekly Sidebar - Hidden on mobile */}
          <div className="hidden lg:flex flex-col w-20">
            <div className="h-8 flex items-center justify-center text-xs text-muted-foreground border-b border-border">
              שבועי
            </div>
            {weeklyData.map((week) => (
              <div
                key={week.weekNum}
                className="flex-1 min-h-[72px] bg-secondary/30 border-b border-border flex flex-col items-center justify-center p-1"
              >
                <span className="text-xs font-medium">שבוע {week.weekNum}</span>
                {week.days > 0 ? (
                  <>
                    <span className={`text-xs font-bold ${week.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                      {formatWeeklyValue(week.pnl, week.points)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{week.days} יום</span>
                  </>
                ) : (
                  <span className="text-[10px] text-muted-foreground">אין עסקאות</span>
                )}
              </div>
            ))}
          </div>

          {/* Main Calendar */}
          <div className="flex-1 overflow-x-hidden" dir="rtl">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {hebrewDays.map((day) => (
                <div
                  key={day}
                  className="h-6 md:h-8 flex items-center justify-center text-[9px] md:text-xs text-muted-foreground border-b border-border"
                >
                  <span className="md:hidden">{day.slice(0, 2)}</span>
                  <span className="hidden md:inline">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
              {calendarDays.map((day, index) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const dayData = tradesByDate[dateStr];
                const hasData = !!dayData;
                const isCurrentDay = isToday(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const pnl = dayData?.pnl || 0;
                const points = dayData?.points || 0;
                const tradeCount = dayData?.count || 0;
                const hasNote = datesWithNotes.includes(dateStr);

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`relative min-h-[48px] md:min-h-[72px] rounded p-0.5 md:p-1 flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.02] cursor-pointer ${
                      hasData
                        ? `${pnl >= 0
                          ? "bg-success/20 border border-success/40 hover:bg-success/30"
                          : "bg-destructive/20 border border-destructive/40 hover:bg-destructive/30"}`
                        : "bg-secondary/30 hover:bg-secondary/50"
                    } ${isCurrentDay ? "ring-2 ring-primary" : ""} ${!isCurrentMonth ? "opacity-30 bg-secondary/10" : ""}`}
                  >
                    {hasNote && (
                      <div className="absolute top-0.5 left-0.5 md:top-1 md:left-1 h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary" title="יש הערה" />
                    )}
                    <span
                      className={`text-[10px] md:text-sm ${isCurrentDay ? "font-bold text-primary" : hasData ? (pnl >= 0 ? "text-success" : "text-destructive") : isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {format(day, "d")}
                    </span>
                    {hasData && (
                      <>
                        <span className={`text-[9px] md:text-sm font-bold leading-tight ${pnl >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatValue(pnl, points)}
                        </span>
                        <span className={`text-[7px] md:text-[10px] leading-tight ${pnl >= 0 ? "text-success/70" : "text-destructive/70"}`}>
                          {tradeCount}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Day Trades Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>
                עסקאות ביום {selectedDate ? format(new Date(selectedDate), "dd/MM/yyyy") : ""}
              </span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {selectedDayTrades.map((trade) => {
              const value = displayMode === "points" ? (trade.pnl_points || 0) : (trade.pnl || 0);
              const isProfit = value >= 0;
              const isExpanded = expandedTradeId === trade.id;
              const [reason, ...rest] = (trade.notes || "").split("\n\n[CONCLUSIONS]\n");
              const conclusions = rest.join("\n\n[CONCLUSIONS]\n");
              const hasExtraDetails = Boolean(
                trade.notes || trade.rating || trade.rr || trade.risk ||
                trade.mental_state || trade.setup_type ||
                (trade.mistakes && trade.mistakes.length > 0)
              );

              return (
                <div
                  key={trade.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isProfit
                      ? "bg-success/5 border-success/20"
                      : "bg-destructive/5 border-destructive/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        trade.trade_type === "long"
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}>
                        {trade.trade_type === "long" ? "לונג" : "שורט"}
                      </span>
                      <span className="font-bold text-foreground">{trade.symbol}</span>
                    </div>
                    <span className={`text-lg font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
                      {displayMode === "points"
                        ? `${value >= 0 ? '+' : ''}${value.toFixed(1)} נק׳`
                        : `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`
                      }
                    </span>
                  </div>

                  {/* Trade Screenshot */}
                  {trade.screenshot_url && (
                    <div className="mb-3">
                      <img
                        src={trade.screenshot_url}
                        alt={`צילום מסך - ${trade.symbol}`}
                        className="w-full h-40 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(trade.screenshot_url!, '_blank')}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    {trade.entry_price && (
                      <div>
                        <span className="text-xs">כניסה: </span>
                        <span className="text-foreground">${trade.entry_price}</span>
                      </div>
                    )}
                    {trade.exit_price && (
                      <div>
                        <span className="text-xs">יציאה: </span>
                        <span className="text-foreground">${trade.exit_price}</span>
                      </div>
                    )}
                    {trade.quantity && (
                      <div>
                        <span className="text-xs">כמות: </span>
                        <span className="text-foreground">{trade.quantity}</span>
                      </div>
                    )}
                    {trade.strategy && (
                      <div>
                        <span className="text-xs">אסטרטגיה: </span>
                        <span className="text-foreground">{trade.strategy}</span>
                      </div>
                    )}
                    {trade.rr != null && (
                      <div>
                        <span className="text-xs">RR: </span>
                        <span className="text-foreground">{trade.rr.toFixed(2)}</span>
                      </div>
                    )}
                    {trade.risk != null && (
                      <div>
                        <span className="text-xs">סיכון: </span>
                        <span className="text-foreground">${trade.risk}</span>
                      </div>
                    )}
                  </div>

                  {trade.entry_date && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(trade.entry_date), "HH:mm")}
                    </p>
                  )}

                  {hasExtraDetails && (
                    <>
                      <button
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            הסתר פרטים
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            הצג את כל הפרטים
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 pt-3 border-t border-border/50 animate-fade-in">
                          {trade.rating != null && trade.rating > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <Star className="h-3.5 w-3.5" />
                                דירוג
                              </span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3.5 w-3.5 ${
                                      s <= (trade.rating || 0)
                                        ? "fill-warning text-warning"
                                        : "text-muted-foreground/40"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {(trade.mental_state || trade.setup_type || (trade.mistakes && trade.mistakes.length > 0)) && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <Brain className="h-3.5 w-3.5" />
                                תגיות
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {trade.mental_state && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                                    {trade.mental_state}
                                  </span>
                                )}
                                {trade.setup_type && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/30">
                                    {trade.setup_type}
                                  </span>
                                )}
                                {(trade.mistakes || []).map((m, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                    <AlertTriangle className="h-3 w-3" />
                                    {m}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {reason && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" />
                                סיבת כניסה
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words bg-background/50 rounded-md p-2 border border-border/50">
                                {reason}
                              </p>
                            </div>
                          )}

                          {conclusions && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                מסקנות
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap break-words bg-background/50 rounded-md p-2 border border-border/50">
                                {conclusions}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            
            {selectedDayTrades.length === 0 && (
              <p className="text-center text-muted-foreground py-4">אין עסקאות ביום זה</p>
            )}
          </div>

          {/* Summary */}
          {selectedDayTrades.length > 0 && (
            <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">סה״כ:</span>
                <span className={`font-bold ${
                  (tradesByDate[selectedDate!]?.pnl || 0) >= 0 ? "text-success" : "text-destructive"
                }`}>
                  {displayMode === "points" 
                    ? `${(tradesByDate[selectedDate!]?.points || 0).toFixed(1)} נק׳`
                    : `$${(tradesByDate[selectedDate!]?.pnl || 0).toFixed(2)}`
                  }
                </span>
              </div>
            </div>
          )}

          {/* Add note button in dialog */}
          {selectedDate && (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setNoteDate(selectedDate); setIsNoteDialogOpen(true); }}>
              <BookOpen className="h-4 w-4" />
              {getNoteForDate(selectedDate) ? "ערוך הערת יום" : "הוסף הערת יום"}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      {/* Daily Note Dialog */}
      <DailyNoteDialog
        open={isNoteDialogOpen}
        onOpenChange={setIsNoteDialogOpen}
        date={noteDate}
        existingNote={noteDate ? getNoteForDate(noteDate) : null}
        onSave={upsertNote}
      />
    </>
  );
};
