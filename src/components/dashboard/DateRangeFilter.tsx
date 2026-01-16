import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subMonths, startOfYear, endOfYear } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

type PresetKey = "all" | "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

const presets: { key: PresetKey; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "today", label: "היום" },
  { key: "yesterday", label: "אתמול" },
  { key: "thisWeek", label: "השבוע" },
  { key: "lastWeek", label: "שבוע שעבר" },
  { key: "thisMonth", label: "החודש" },
  { key: "lastMonth", label: "חודש שעבר" },
  { key: "thisYear", label: "השנה" },
  { key: "custom" as PresetKey, label: "מותאם" },
];

export const DateRangeFilter = ({
  dateRange,
  onDateRangeChange,
}: DateRangeFilterProps) => {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>("all");

  const handlePresetClick = (preset: PresetKey) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let range: DateRange = { from: undefined, to: undefined };
    
    switch (preset) {
      case "all":
        range = { from: undefined, to: undefined };
        break;
      case "today":
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        range = { from: todayStart, to: today };
        break;
      case "yesterday":
        const yesterdayStart = subDays(today, 1);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = subDays(today, 1);
        yesterdayEnd.setHours(23, 59, 59, 999);
        range = { from: yesterdayStart, to: yesterdayEnd };
        break;
      case "thisWeek":
        range = { from: startOfWeek(today, { weekStartsOn: 0 }), to: today };
        break;
      case "lastWeek":
        const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 0 });
        const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 0 });
        range = { from: lastWeekStart, to: lastWeekEnd };
        break;
      case "thisMonth":
        range = { from: startOfMonth(today), to: today };
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case "thisYear":
        range = { from: startOfYear(today), to: today };
        break;
      case "custom":
        // Keep current range, just open calendar
        setOpen(true);
        setActivePreset("custom");
        return;
    }
    
    setActivePreset(preset);
    onDateRangeChange(range);
    setOpen(false);
  };

  const handleCalendarSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      onDateRangeChange({ from: range.from, to: range.to });
      setActivePreset("custom");
    }
  };

  const clearFilter = () => {
    onDateRangeChange({ from: undefined, to: undefined });
    setActivePreset("all");
    setOpen(false);
  };

  const getDisplayText = () => {
    if (!dateRange.from && !dateRange.to) {
      return "כל התאריכים";
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd/MM/yy", { locale: he })} - ${format(dateRange.to, "dd/MM/yy", { locale: he })}`;
    }
    if (dateRange.from) {
      return `מ-${format(dateRange.from, "dd/MM/yy", { locale: he })}`;
    }
    return "בחר תאריכים";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-right font-normal gap-2 min-w-[140px]",
            !dateRange.from && !dateRange.to && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="truncate text-xs md:text-sm">{getDisplayText()}</span>
          {(dateRange.from || dateRange.to) && (
            <X
              className="h-3 w-3 ml-auto opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                clearFilter();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col md:flex-row">
          {/* Presets */}
          <div className="flex flex-row md:flex-col gap-1 p-3 border-b md:border-b-0 md:border-l overflow-x-auto md:overflow-visible">
            {presets.map((preset) => (
              <Button
                key={preset.key}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start whitespace-nowrap text-xs",
                  activePreset === preset.key && "bg-primary text-primary-foreground"
                )}
                onClick={() => handlePresetClick(preset.key)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          
          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
              disabled={(date) => date > new Date()}
              className="pointer-events-auto"
              locale={he}
            />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
              <Button variant="ghost" size="sm" onClick={clearFilter}>
                נקה
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                אישור
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
