import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Loader2 } from "lucide-react";

interface BacktestingControlsProps {
  onLoadData: (symbol: string, interval: string) => void;
  loading: boolean;
}

const ASSET_CATEGORIES = {
  forex: {
    label: "מט\"ח",
    assets: [
      { value: "EUR/USD", label: "EUR/USD" },
      { value: "GBP/USD", label: "GBP/USD" },
      { value: "USD/JPY", label: "USD/JPY" },
      { value: "USD/CHF", label: "USD/CHF" },
      { value: "AUD/USD", label: "AUD/USD" },
      { value: "USD/CAD", label: "USD/CAD" },
      { value: "NZD/USD", label: "NZD/USD" },
    ]
  },
  crypto: {
    label: "קריפטו",
    assets: [
      { value: "BTC/USD", label: "BTC/USD" },
      { value: "ETH/USD", label: "ETH/USD" },
      { value: "XRP/USD", label: "XRP/USD" },
      { value: "SOL/USD", label: "SOL/USD" },
      { value: "ADA/USD", label: "ADA/USD" },
    ]
  },
  indices: {
    label: "מדדים",
    assets: [
      { value: "SPX", label: "S&P 500" },
      { value: "NDX", label: "NASDAQ 100" },
      { value: "DJI", label: "Dow Jones" },
      { value: "DAX", label: "DAX" },
    ]
  },
  stocks: {
    label: "מניות",
    assets: [
      { value: "AAPL", label: "Apple" },
      { value: "MSFT", label: "Microsoft" },
      { value: "GOOGL", label: "Google" },
      { value: "AMZN", label: "Amazon" },
      { value: "TSLA", label: "Tesla" },
      { value: "NVDA", label: "NVIDIA" },
    ]
  }
};

const TIMEFRAMES = [
  { value: "1m", label: "1 דקה" },
  { value: "5m", label: "5 דקות" },
  { value: "15m", label: "15 דקות" },
  { value: "1h", label: "שעה" },
  { value: "4h", label: "4 שעות" },
  { value: "1D", label: "יומי" },
];

export const BacktestingControls = ({ onLoadData, loading }: BacktestingControlsProps) => {
  const [category, setCategory] = useState("forex");
  const [symbol, setSymbol] = useState("EUR/USD");
  const [interval, setInterval] = useState("1h");

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const firstAsset = ASSET_CATEGORIES[cat as keyof typeof ASSET_CATEGORIES]?.assets[0]?.value;
    if (firstAsset) setSymbol(firstAsset);
  };

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">קטגוריה:</span>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ASSET_CATEGORIES).map(([key, cat]) => (
              <SelectItem key={key} value={key}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">נכס:</span>
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_CATEGORIES[category as keyof typeof ASSET_CATEGORIES]?.assets.map(
              (asset) => (
                <SelectItem key={asset.value} value={asset.value}>
                  {asset.label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">טיימפריים:</span>
        <Select value={interval} onValueChange={setInterval}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMEFRAMES.map((tf) => (
              <SelectItem key={tf.value} value={tf.value}>
                {tf.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={() => onLoadData(symbol, interval)} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        טען נתונים
      </Button>
    </div>
  );
};
