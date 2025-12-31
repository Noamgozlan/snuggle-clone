import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  CandlestickChart,
  LineChart,
  AreaChart,
  TrendingUp,
  BarChart3,
  Maximize2,
  Grid3X3,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import type { ChartSettings, ChartType, IndicatorConfig } from "./types";
import { cn } from "@/lib/utils";

interface ChartToolbarProps {
  settings: ChartSettings;
  onSettingsChange: (settings: ChartSettings) => void;
  onFullscreen?: () => void;
}

const CHART_TYPES: { type: ChartType; icon: React.ElementType; label: string }[] = [
  { type: "candles", icon: CandlestickChart, label: "נרות" },
  { type: "heikinAshi", icon: CandlestickChart, label: "Heikin-Ashi" },
  { type: "line", icon: LineChart, label: "קו" },
  { type: "area", icon: AreaChart, label: "שטח" },
];

const AVAILABLE_INDICATORS = [
  { type: "sma", label: "SMA", defaultParams: { period: 20 }, color: "#2563eb" },
  { type: "ema", label: "EMA", defaultParams: { period: 9 }, color: "#f97316" },
  { type: "bollinger", label: "Bollinger Bands", defaultParams: { period: 20, stdDev: 2 }, color: "#8b5cf6" },
  { type: "rsi", label: "RSI", defaultParams: { period: 14 }, color: "#eab308" },
  { type: "macd", label: "MACD", defaultParams: { fast: 12, slow: 26, signal: 9 }, color: "#06b6d4" },
] as const;

export const ChartToolbar = ({
  settings,
  onSettingsChange,
  onFullscreen,
}: ChartToolbarProps) => {
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);

  const handleChartTypeChange = (type: ChartType) => {
    onSettingsChange({ ...settings, chartType: type });
  };

  const handleAddIndicator = (indicatorType: string) => {
    const indicatorDef = AVAILABLE_INDICATORS.find((i) => i.type === indicatorType);
    if (!indicatorDef) return;

    const newIndicator: IndicatorConfig = {
      id: `${indicatorType}-${Date.now()}`,
      type: indicatorType as IndicatorConfig["type"],
      enabled: true,
      params: indicatorDef.defaultParams,
      color: indicatorDef.color,
    };

    onSettingsChange({
      ...settings,
      indicators: [...settings.indicators, newIndicator],
    });
  };

  const handleRemoveIndicator = (id: string) => {
    onSettingsChange({
      ...settings,
      indicators: settings.indicators.filter((i) => i.id !== id),
    });
  };

  const handleToggleIndicator = (id: string) => {
    onSettingsChange({
      ...settings,
      indicators: settings.indicators.map((i) =>
        i.id === id ? { ...i, enabled: !i.enabled } : i
      ),
    });
  };

  const CurrentChartIcon =
    CHART_TYPES.find((c) => c.type === settings.chartType)?.icon || CandlestickChart;

  return (
    <div className="flex items-center gap-1 p-1.5 bg-card/80 backdrop-blur-sm border-b border-border">
      {/* Chart Type Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
            <CurrentChartIcon className="h-4 w-4" />
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {CHART_TYPES.map((chartType) => (
            <DropdownMenuItem
              key={chartType.type}
              onClick={() => handleChartTypeChange(chartType.type)}
              className={cn(
                "gap-2",
                settings.chartType === chartType.type && "bg-accent"
              )}
            >
              <chartType.icon className="h-4 w-4" />
              {chartType.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-border" />

      {/* Indicators */}
      <DropdownMenu open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">אינדיקטורים</span>
            {settings.indicators.length > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-1.5 rounded">
                {settings.indicators.length}
              </span>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            הוסף אינדיקטור
          </div>
          {AVAILABLE_INDICATORS.map((indicator) => (
            <DropdownMenuItem
              key={indicator.type}
              onClick={() => handleAddIndicator(indicator.type)}
              className="gap-2"
            >
              <Plus className="h-3 w-3" />
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: indicator.color }}
              />
              {indicator.label}
            </DropdownMenuItem>
          ))}

          {settings.indicators.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                אינדיקטורים פעילים
              </div>
              {settings.indicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between px-2 py-1.5 hover:bg-accent rounded-sm"
                >
                  <DropdownMenuCheckboxItem
                    checked={indicator.enabled}
                    onCheckedChange={() => handleToggleIndicator(indicator.id)}
                    className="p-0 gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: indicator.color }}
                    />
                    {AVAILABLE_INDICATORS.find((i) => i.type === indicator.type)?.label}
                  </DropdownMenuCheckboxItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveIndicator(indicator.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="w-px h-4 bg-border" />

      {/* Volume Toggle */}
      <Button
        variant={settings.showVolume ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1 px-2"
        onClick={() => onSettingsChange({ ...settings, showVolume: !settings.showVolume })}
      >
        <BarChart3 className="h-4 w-4" />
        <span className="text-xs">Vol</span>
      </Button>

      {/* Grid Toggle */}
      <Button
        variant={settings.showGrid ? "secondary" : "ghost"}
        size="sm"
        className="h-7 gap-1 px-2"
        onClick={() => onSettingsChange({ ...settings, showGrid: !settings.showGrid })}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Fullscreen */}
      {onFullscreen && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={onFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
