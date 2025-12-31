import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth, isToday } from "date-fns";
import { he } from "date-fns/locale";

interface Trade {
  id: string;
  pnl: number | null;
  entry_date: string | null;
  created_at: string;
}

interface TradingCalendarProps {
  trades: Trade[];
}

const hebrewDays = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const hebrewMonths = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

export const TradingCalendar = ({ trades }: TradingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get trades grouped by date
  const tradesByDate = useMemo(() => {
    const grouped: Record<string, { pnl: number; count: number }> = {};
    
    trades.forEach((trade) => {
      const dateStr = trade.entry_date 
        ? format(new Date(trade.entry_date), "yyyy-MM-dd")
        : format(new Date(trade.created_at), "yyyy-MM-dd");
      
      if (!grouped[dateStr]) {
        grouped[dateStr] = { pnl: 0, count: 0 };
      }
      grouped[dateStr].pnl += trade.pnl || 0;
      grouped[dateStr].count += 1;
    });
    
    return grouped;
  }, [trades]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let totalPnl = 0;
    let tradingDays = 0;
    
    Object.entries(tradesByDate).forEach(([dateStr, data]) => {
      const date = new Date(dateStr);
      if (isSameMonth(date, currentDate)) {
        totalPnl += data.pnl;
        tradingDays += 1;
      }
    });
    
    return { totalPnl, tradingDays };
  }, [tradesByDate, currentDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days at the start (for RTL, we need to adjust)
    const firstDayOfWeek = getDay(monthStart);
    const paddingDays = Array(firstDayOfWeek).fill(null);
    
    return [...paddingDays, ...days];
  }, [monthStart, monthEnd]);

  // Group by weeks for the sidebar
  const weeklyData = useMemo(() => {
    const weeks: { weekNum: number; pnl: number; days: number }[] = [];
    let currentWeek = 1;
    let weekPnl = 0;
    let weekDays = 0;
    
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    days.forEach((day, index) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const dayData = tradesByDate[dateStr];
      
      if (dayData) {
        weekPnl += dayData.pnl;
        weekDays += 1;
      }
      
      // Every 7 days or at the end, push the week data
      if ((index + getDay(monthStart) + 1) % 7 === 0 || index === days.length - 1) {
        weeks.push({ weekNum: currentWeek, pnl: weekPnl, days: weekDays });
        currentWeek += 1;
        weekPnl = 0;
        weekDays = 0;
      }
    });
    
    return weeks;
  }, [monthStart, monthEnd, tradesByDate]);

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <Card className="bg-card border-border p-4 hover-glow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={goToPreviousMonth}
          className="hover:scale-110 transition-transform"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="font-bold text-lg">
            {hebrewMonths[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <p className="text-sm text-muted-foreground">
            חודשי: ${monthlyStats.totalPnl.toFixed(0)}, {monthlyStats.tradingDays} יום
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={goToNextMonth}
          className="hover:scale-110 transition-transform"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid with Weekly Sidebar */}
      <div className="flex gap-2">
        {/* Weekly Sidebar */}
        <div className="flex flex-col w-20">
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
                  <span className={`text-xs font-bold ${week.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                    ${week.pnl.toFixed(0)}
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
        <div className="flex-1">
          {/* Days Header */}
          <div className="grid grid-cols-7 gap-1">
            {[...hebrewDays].reverse().map((day) => (
              <div key={day} className="h-8 flex items-center justify-center text-xs text-muted-foreground border-b border-border">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[72px] bg-secondary/20 rounded" />;
              }

              const dateStr = format(day, "yyyy-MM-dd");
              const dayData = tradesByDate[dateStr];
              const hasData = !!dayData;
              const isCurrentDay = isToday(day);
              const pnl = dayData?.pnl || 0;
              const tradeCount = dayData?.count || 0;

              return (
                <div
                  key={dateStr}
                  className={`min-h-[72px] rounded p-1 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                    hasData
                      ? pnl >= 0
                        ? "bg-success/20 border border-success/40"
                        : "bg-destructive/20 border border-destructive/40"
                      : "bg-secondary/30"
                  } ${isCurrentDay ? "ring-2 ring-primary" : ""}`}
                >
                  <span className={`text-sm ${isCurrentDay ? "font-bold text-primary" : hasData ? (pnl >= 0 ? "text-success" : "text-destructive") : "text-foreground"}`}>
                    {format(day, "d")}
                  </span>
                  {hasData && (
                    <>
                      <span className={`text-sm font-bold ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                        ${Math.abs(pnl).toFixed(0)}
                      </span>
                      <span className={`text-[10px] ${pnl >= 0 ? 'text-success/70' : 'text-destructive/70'}`}>
                        {tradeCount} עסקה
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
  );
};
