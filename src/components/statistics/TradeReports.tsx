import { useState, useMemo } from "react";
import { MENTAL_STATES, MISTAKES, SETUP_TYPES, getMentalStateInfo } from "@/components/trades/TradeTagsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Filter, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Clock,
  Target,
  Hash,
  Image,
  ArrowUpRight,
  ArrowDownRight,
  X,
  FileText,
  Brain,
  AlertTriangle,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { generateTradingPDF } from "@/lib/generatePDF";

interface Trade {
  id: string;
  symbol: string;
  trade_type: string;
  quantity: number;
  entry_date: string | null;
  exit_date: string | null;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  is_closed: boolean;
  strategy: string | null;
  screenshot_url: string | null;
  notes: string | null;
  rr: number | null;
  mental_state: string | null;
  mistakes: string[] | null;
  setup_type: string | null;
}

interface TradeReportsProps {
  trades: Trade[];
  strategies: string[];
}

const DAYS_OF_WEEK = [
  { value: 'all', label: 'כל הימים' },
  { value: '0', label: 'ראשון' },
  { value: '1', label: 'שני' },
  { value: '2', label: 'שלישי' },
  { value: '3', label: 'רביעי' },
  { value: '4', label: 'חמישי' },
  { value: '5', label: 'שישי' },
  { value: '6', label: 'שבת' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i.toString(),
  label: `${i.toString().padStart(2, '0')}:00`
}));

export const TradeReports = ({ trades, strategies }: TradeReportsProps) => {
  const [showFilters, setShowFilters] = useState(true);
  const [selectedDay, setSelectedDay] = useState('all');
  const [startHour, setStartHour] = useState(0);
  const [endHour, setEndHour] = useState(23);
  const [selectedStrategy, setSelectedStrategy] = useState('all');
  const [selectedSymbol, setSelectedSymbol] = useState('all');
  const [quantityRange, setQuantityRange] = useState([1, 100]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [selectedMentalState, setSelectedMentalState] = useState('all');
  const [selectedSetupType, setSelectedSetupType] = useState('all');
  const [selectedMistake, setSelectedMistake] = useState('all');

  // Get unique symbols
  const symbols = useMemo(() => {
    const uniqueSymbols = [...new Set(trades.map(t => t.symbol))];
    return uniqueSymbols.sort();
  }, [trades]);

  // Get max quantity
  const maxQuantity = useMemo(() => {
    return Math.max(...trades.map(t => t.quantity), 1);
  }, [trades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Day of week filter
      if (selectedDay !== 'all' && trade.entry_date) {
        const tradeDay = new Date(trade.entry_date).getDay();
        if (tradeDay.toString() !== selectedDay) return false;
      }

      // Time of day filter
      if (trade.entry_date) {
        const tradeHour = new Date(trade.entry_date).getHours();
        if (tradeHour < startHour || tradeHour > endHour) return false;
      }

      // Strategy filter
      if (selectedStrategy !== 'all' && trade.strategy !== selectedStrategy) return false;

      // Symbol filter
      if (selectedSymbol !== 'all' && trade.symbol !== selectedSymbol) return false;

      // Quantity filter
      if (trade.quantity < quantityRange[0] || trade.quantity > quantityRange[1]) return false;

      // Mental state filter (comma-separated)
      if (selectedMentalState !== 'all') {
        const states = (trade.mental_state || "").split(",").map(s => s.trim());
        if (!states.includes(selectedMentalState)) return false;
      }

      // Setup type filter (comma-separated)
      if (selectedSetupType !== 'all') {
        const setups = (trade.setup_type || "").split(",").map(s => s.trim());
        if (!setups.includes(selectedSetupType)) return false;
      }

      // Mistake filter
      if (selectedMistake !== 'all' && (!trade.mistakes || !trade.mistakes.includes(selectedMistake))) return false;

      return true;
    });
  }, [trades, selectedDay, startHour, endHour, selectedStrategy, selectedSymbol, quantityRange, selectedMentalState, selectedSetupType, selectedMistake]);

  // Calculate statistics
  const stats = useMemo(() => {
    const closedTrades = filteredTrades.filter(t => t.is_closed);
    const winningTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.pnl || 0) < 0);
    
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length 
      : 0;
    const avgLoss = losingTrades.length > 0 
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losingTrades.length 
      : 0;
    const winRate = closedTrades.length > 0 
      ? (winningTrades.length / closedTrades.length) * 100 
      : 0;
    const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalPnl,
      avgWin,
      avgLoss,
      winRate,
      avgRR
    };
  }, [filteredTrades]);

  // Calculate P&L by hour
  const pnlByHour = useMemo(() => {
    const hourData: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourData[i] = 0;
    }

    filteredTrades.forEach(trade => {
      if (trade.entry_date && trade.pnl !== null) {
        const hour = new Date(trade.entry_date).getHours();
        hourData[hour] += trade.pnl;
      }
    });

    return Object.entries(hourData)
      .filter(([_, pnl]) => pnl !== 0)
      .map(([hour, pnl]) => ({
        hour: `${hour}:00`,
        pnl,
        fill: pnl >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'
      }));
  }, [filteredTrades]);

  // Calculate P&L by day
  const pnlByDay = useMemo(() => {
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayData: Record<number, { wins: number; losses: number }> = {};
    
    for (let i = 0; i < 7; i++) {
      dayData[i] = { wins: 0, losses: 0 };
    }

    filteredTrades.forEach(trade => {
      if (trade.entry_date && trade.pnl !== null) {
        const day = new Date(trade.entry_date).getDay();
        if (trade.pnl >= 0) {
          dayData[day].wins += trade.pnl;
        } else {
          dayData[day].losses += Math.abs(trade.pnl);
        }
      }
    });

    return Object.entries(dayData)
      .map(([day, data]) => ({
        day: dayNames[parseInt(day)],
        wins: data.wins,
        losses: data.losses
      }));
  }, [filteredTrades]);

  const resetFilters = () => {
    setSelectedDay('all');
    setStartHour(0);
    setEndHour(23);
    setSelectedStrategy('all');
    setSelectedSymbol('all');
    setQuantityRange([1, maxQuantity]);
    setSelectedMentalState('all');
    setSelectedSetupType('all');
    setSelectedMistake('all');
  };

  // Get trades with screenshots
  const tradesWithScreenshots = filteredTrades.filter(t => t.screenshot_url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            דוחות מותאמים אישית
          </h2>
          <p className="text-muted-foreground">סנן את העסקאות שלך וקבל תובנות מפורטות</p>
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? 'הסתר פילטרים' : 'הצג פילטרים'}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                פילטרים
              </span>
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 ml-1" />
                אפס
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Day of Week */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  יום בשבוע
                </label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  טווח שעות
                </label>
                <div className="flex items-center gap-2">
                  <Select value={startHour.toString()} onValueChange={(v) => setStartHour(parseInt(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map(h => (
                        <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">עד</span>
                  <Select value={endHour.toString()} onValueChange={(v) => setEndHour(parseInt(v))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map(h => (
                        <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Strategy */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  אסטרטגיה
                </label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל האסטרטגיות</SelectItem>
                    {strategies.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Symbol */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  סימול
                </label>
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסימולים</SelectItem>
                    {symbols.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mental State */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  מצב מנטלי
                </label>
                <Select value={selectedMentalState} onValueChange={setSelectedMentalState}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל המצבים</SelectItem>
                    {MENTAL_STATES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Setup Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  סוג Setup
                </label>
                <Select value={selectedSetupType} onValueChange={setSelectedSetupType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסוגים</SelectItem>
                    {SETUP_TYPES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mistakes */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  טעות
                </label>
                <Select value={selectedMistake} onValueChange={setSelectedMistake}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הטעויות</SelectItem>
                    {MISTAKES.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  כמות חוזים: {quantityRange[0]} - {quantityRange[1]}
                </label>
                <Slider
                  value={quantityRange}
                  onValueChange={setQuantityRange}
                  min={1}
                  max={maxQuantity}
                  step={1}
                  className="py-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters */}
      <div className="flex flex-wrap gap-2">
        {selectedDay !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            יום: {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDay('all')} />
          </Badge>
        )}
        {(startHour !== 0 || endHour !== 23) && (
          <Badge variant="secondary" className="gap-1">
            שעות: {startHour}:00 - {endHour}:00
            <X className="h-3 w-3 cursor-pointer" onClick={() => { setStartHour(0); setEndHour(23); }} />
          </Badge>
        )}
        {selectedStrategy !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            אסטרטגיה: {selectedStrategy}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedStrategy('all')} />
          </Badge>
        )}
        {selectedSymbol !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            סימול: {selectedSymbol}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSymbol('all')} />
          </Badge>
        )}
        {selectedMentalState !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            מצב מנטלי: {getMentalStateInfo(selectedMentalState)?.label || selectedMentalState}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedMentalState('all')} />
          </Badge>
        )}
        {selectedSetupType !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            Setup: {selectedSetupType}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedSetupType('all')} />
          </Badge>
        )}
        {selectedMistake !== 'all' && (
          <Badge variant="secondary" className="gap-1">
            טעות: {selectedMistake}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedMistake('all')} />
          </Badge>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Net P&L */}
        <Card className="bg-card border-border col-span-2 md:col-span-1">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">סה"כ רווח/הפסד</p>
            <p className={`text-3xl font-bold ${stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">אחוז הצלחה</p>
            <p className={`text-3xl font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
              {stats.winRate.toFixed(1)}%
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-success border-success/30">
                {stats.winningTrades} ✓
              </Badge>
              <Badge variant="outline" className="text-destructive border-destructive/30">
                {stats.losingTrades} ✗
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Avg R:R */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">יחס ממוצע</p>
            <p className="text-3xl font-bold text-foreground">
              {stats.avgRR.toFixed(1)}R
            </p>
          </CardContent>
        </Card>

        {/* Avg Win/Loss */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">ממוצע רווח/הפסד</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 bg-success rounded-full" style={{ width: `${Math.min(stats.avgWin / (stats.avgWin + stats.avgLoss) * 100, 100)}%` }} />
                <span className="text-sm text-success">${stats.avgWin.toFixed(0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 bg-destructive rounded-full" style={{ width: `${Math.min(stats.avgLoss / (stats.avgWin + stats.avgLoss) * 100, 100)}%` }} />
                <span className="text-sm text-destructive">-${stats.avgLoss.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L by Hour */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              רווח/הפסד לפי שעה
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pnlByHour.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pnlByHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                  />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {pnlByHour.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>

        {/* P&L by Day */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              רווח/הפסד לפי יום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pnlByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="wins" fill="hsl(var(--success))" name="רווחים" radius={[4, 4, 0, 0]} />
                <Bar dataKey="losses" fill="hsl(var(--destructive))" name="הפסדים" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Screenshots */}
      {tradesWithScreenshots.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              צילומי מסך מעסקאות ({tradesWithScreenshots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {tradesWithScreenshots.slice(0, 8).map(trade => (
                <div
                  key={trade.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden border border-border"
                  onClick={() => setSelectedScreenshot(trade.screenshot_url)}
                >
                  <img
                    src={trade.screenshot_url!}
                    alt={trade.symbol}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium">{trade.symbol}</span>
                      {trade.pnl !== null && (
                        <Badge variant={trade.pnl >= 0 ? "default" : "destructive"} className="text-xs">
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtered Trades List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            עסקאות מסוננות ({filteredTrades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredTrades.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  לא נמצאו עסקאות לפי הפילטרים שנבחרו
                </div>
              ) : (
                filteredTrades.map(trade => (
                  <div
                    key={trade.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${trade.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                      {trade.trade_type === 'long' 
                        ? <ArrowUpRight className="h-4 w-4 text-success" />
                        : <ArrowDownRight className="h-4 w-4 text-destructive" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{trade.symbol}</span>
                        {trade.strategy && (
                          <Badge variant="outline" className="text-xs">{trade.strategy}</Badge>
                        )}
                        {trade.mental_state && (() => {
                          const info = getMentalStateInfo(trade.mental_state);
                          if (!info) return null;
                          const Icon = info.icon;
                          return <Badge variant="outline" className={`text-xs gap-1 ${info.color}`}><Icon className="h-3 w-3" />{info.label}</Badge>;
                        })()}
                        {trade.setup_type && (
                          <Badge variant="outline" className="text-xs text-violet-400 border-violet-500/30">{trade.setup_type}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {trade.entry_date && format(new Date(trade.entry_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                        {' • '}
                        {trade.quantity} חוזים
                      </p>
                    </div>
                    <div className="text-left">
                      {trade.pnl !== null && (
                        <p className={`font-semibold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                      )}
                      {trade.rr !== null && (
                        <p className="text-xs text-muted-foreground">{trade.rr.toFixed(1)}R</p>
                      )}
                    </div>
                    {trade.screenshot_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedScreenshot(trade.screenshot_url)}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Screenshot Dialog */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>צילום מסך</DialogTitle>
          </DialogHeader>
          {selectedScreenshot && (
            <img
              src={selectedScreenshot}
              alt="Trade Screenshot"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
