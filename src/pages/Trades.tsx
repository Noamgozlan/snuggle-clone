import { useState, useEffect } from "react";
import { calculateAverageTradeDuration } from "@/lib/formatDuration";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { AddTradeDialog } from "@/components/trades/AddTradeDialog";
import { EditTradeDialog } from "@/components/trades/EditTradeDialog";
import { TradeSummaryDialog } from "@/components/trades/TradeSummaryDialog";
import { CSVImportDialog } from "@/components/trades/CSVImportDialog";
import { useTrades, Trade } from "@/hooks/useTrades";
import { useStrategies } from "@/hooks/useStrategies";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  Filter,
  Trash2,
  Plus,
  FileDown,
  Star,
  Loader2,
  X,
  CheckCircle2,
  Image,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMentalStateInfo } from "@/components/trades/TradeTagsSection";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface TradeConfirmation {
  trade_id: string;
  confirmation_name: string;
}

interface TradeScreenshot {
  id: string;
  trade_id: string;
  screenshot_url: string;
  position: number;
  timeframe?: string;
}

const Trades = () => {
  const { trades, stats, loading, fetchTrades, deleteTrade, deleteAllTrades } = useTrades();
  const { strategies } = useStrategies();
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [tradeConfirmations, setTradeConfirmations] = useState<TradeConfirmation[]>([]);
  const [tradeScreenshots, setTradeScreenshots] = useState<TradeScreenshot[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [confirmationTradeId, setConfirmationTradeId] = useState<string | null>(null);
  const [newConfirmationName, setNewConfirmationName] = useState("");
  const [selectedStrategyForConfirmation, setSelectedStrategyForConfirmation] = useState<string>("");

  // Update selectedTrade when trades array changes (after fetch)
  useEffect(() => {
    if (selectedTrade && trades.length > 0) {
      const updatedTrade = trades.find(t => t.id === selectedTrade.id);
      if (updatedTrade && JSON.stringify(updatedTrade) !== JSON.stringify(selectedTrade)) {
        setSelectedTrade(updatedTrade);
      }
    }
  }, [trades]);

  // Fetch confirmations and screenshots for all trades
  useEffect(() => {
    const fetchTradeData = async () => {
      if (!user) return;

      // Fetch confirmations
      const { data: confData, error: confError } = await supabase
        .from("trade_confirmations")
        .select("trade_id, confirmation_name");

      if (!confError && confData) {
        setTradeConfirmations(confData);
      }

      // Fetch screenshots
      const { data: ssData, error: ssError } = await supabase
        .from("trade_screenshots")
        .select("id, trade_id, screenshot_url, position, timeframe")
        .order("position", { ascending: true });

      if (!ssError && ssData) {
        setTradeScreenshots(ssData);
      }
    };

    fetchTradeData();
  }, [user, trades]);

  const getTradeConfirmations = (tradeId: string) => {
    return tradeConfirmations.filter((tc) => tc.trade_id === tradeId).map((tc) => tc.confirmation_name);
  };

  const getTradeScreenshots = (tradeId: string) => {
    return tradeScreenshots.filter((ss) => ss.trade_id === tradeId);
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    const result = await deleteAllTrades();
    setIsDeleting(false);

    if (result.success) {
      toast({
        title: t("trades.allDeleted"),
        description: t("trades.allDeletedDesc"),
      });
    } else {
      toast({
        title: t("general.error"),
        description: t("trades.errorDelete"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    setDeletingTradeId(tradeId);
    const result = await deleteTrade(tradeId);
    setDeletingTradeId(null);

    if (result.success) {
      toast({
        title: t("trades.deleted"),
        description: t("trades.deletedDesc"),
      });
    } else {
      toast({
        title: t("general.error"),
        description: t("trades.errorDeleteTrade"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirmation = async (tradeId: string, confirmationName: string) => {
    try {
      const { error } = await supabase
        .from("trade_confirmations")
        .delete()
        .eq("trade_id", tradeId)
        .eq("confirmation_name", confirmationName);

      if (error) throw error;

      // Update local state
      setTradeConfirmations((prev) =>
        prev.filter((tc) => !(tc.trade_id === tradeId && tc.confirmation_name === confirmationName))
      );

      toast({
        title: "אישור נמחק",
        description: `האישור "${confirmationName}" הוסר בהצלחה`,
      });
    } catch (error) {
      console.error("Error deleting confirmation:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את האישור",
        variant: "destructive",
      });
    }
  };

  const handleAddConfirmation = (tradeId: string) => {
    setConfirmationTradeId(tradeId);
    setNewConfirmationName("");
    setSelectedStrategyForConfirmation("");
    setConfirmationDialogOpen(true);
  };

  const handleSaveConfirmation = async () => {
    if (!confirmationTradeId || !newConfirmationName.trim()) return;

    try {
      const { error } = await supabase
        .from("trade_confirmations")
        .insert({
          trade_id: confirmationTradeId,
          confirmation_name: newConfirmationName.trim(),
        });

      if (error) throw error;

      // Update local state
      setTradeConfirmations((prev) => [
        ...prev,
        { trade_id: confirmationTradeId, confirmation_name: newConfirmationName.trim() },
      ]);

      toast({
        title: "אישור נוסף",
        description: `האישור "${newConfirmationName.trim()}" נוסף בהצלחה`,
      });

      setConfirmationDialogOpen(false);
      setNewConfirmationName("");
      setConfirmationTradeId(null);
    } catch (error) {
      console.error("Error adding confirmation:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את האישור",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return "—";
    return `$${price.toFixed(2)}`;
  };

  const formatPnl = (pnl: number | null) => {
    if (pnl === null || pnl === undefined) return "—";
    const prefix = pnl >= 0 ? "+" : "";
    return `${prefix}$${pnl.toFixed(2)}`;
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return "—";
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    );
  };

  // Filter trades by date
  const filteredTrades = trades.filter((trade) => {
    const tradeDate = new Date(trade.entry_date || trade.created_at);
    if (fromDate && tradeDate < fromDate) return false;
    if (toDate) {
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (tradeDate > endOfDay) return false;
    }
    return true;
  });

  // Calculate average trade duration using utility function
  const avgDuration = calculateAverageTradeDuration(filteredTrades);

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsSummaryOpen(true);
  };

  const handleEditFromSummary = () => {
    setIsSummaryOpen(false);
    setIsEditOpen(true);
  };

  const clearDateFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
  };

  return (
    <DashboardLayout title={t("trades.title")}>
      <div className="space-y-6">
        {/* Filters - Mobile Responsive */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between animate-fade-in mt-8 md:mt-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="default"
              className="gap-2 bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-sm"
              onClick={() => setIsAddTradeOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("trades.addTrade")}</span>
              <span className="sm:hidden">{t("trades.addTradeShort")}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:scale-105 transition-transform"
              onClick={() => setIsCSVImportOpen(true)}
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">{t("trades.importCSV")}</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 hover:scale-105 transition-transform"
                  disabled={trades.length === 0}
                >
                   <Trash2 className="h-4 w-4" />
                   <span className="hidden sm:inline">{t("trades.deleteAll")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("trades.deleteConfirm")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("trades.deleteConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("general.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("trades.deleteAll")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <span className="text-xs md:text-sm text-muted-foreground">{filteredTrades.length} {t("trades.count")}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "hover:scale-105 transition-transform text-xs md:text-sm",
                    fromDate && "bg-primary/10 border-primary",
                  )}
                >
                  <CalendarIcon className="h-4 w-4 ml-1 md:ml-2" />
                  {fromDate ? format(fromDate, "dd/MM/yy") : t("trades.fromDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  locale={he}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "hover:scale-105 transition-transform text-xs md:text-sm",
                    toDate && "bg-primary/10 border-primary",
                  )}
                >
                  <CalendarIcon className="h-4 w-4 ml-1 md:ml-2" />
                  {toDate ? format(toDate, "dd/MM/yy") : t("trades.toDate")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  locale={he}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <div className="hidden md:flex gap-1">
              <Button variant="default" size="sm" className="bg-primary">
                {t("trades.moneyBtn")}
              </Button>
              <Button variant="secondary" size="sm">
                {t("trades.pointsBtn")}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
               <Filter className="h-4 w-4 md:me-2" />
               <span className="hidden md:inline">{t("trades.filters")}</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <Card className="bg-card border-border p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("trades.netPnl")}</p>
                <p className={`text-xl font-bold tabular-nums ${stats.totalPnl >= 0 ? "text-success" : "text-destructive"}`}>
                  {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              <div
                className="h-1.5 bg-destructive/60 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalTrades > 0 ? (stats.losingTrades / stats.totalTrades) * 100 : 50}%` }}
              />
              <div
                className="h-1.5 bg-success/60 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 50}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
              <span>{t("trades.loss")} ({stats.losingTrades})</span>
              <span>{t("trades.profit")} ({stats.winningTrades})</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-3.5 flex flex-col items-center justify-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">W/L Ratio</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats.maxLoss !== 0 ? Math.abs(stats.maxWin / stats.maxLoss).toFixed(2) : "—"}
            </p>
          </Card>

          <Card className="bg-card border-border p-3.5 flex flex-col items-center justify-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("trades.winRate")}</p>
            <ProgressRing value={stats.winRate} size={70} strokeWidth={5} />
          </Card>

          <Card className="bg-card border-border p-3.5 flex flex-col items-center justify-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Avg RR</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.avgRR.toFixed(2)}</p>
          </Card>

          <Card className="bg-card border-border p-3.5 flex flex-col items-center justify-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t("trades.avgTime")}</p>
            <p className="text-xl font-bold text-foreground tabular-nums" dir="ltr">
              {avgDuration ?? "—"}
            </p>
          </Card>
        </div>

        {/* Trades Table */}
        <Card className="bg-card border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm mb-4">{t("trades.noTrades")}</p>
              <Button variant="default" size="sm" onClick={() => setIsAddTradeOpen(true)}>
                <Plus className="h-4 w-4 me-2" />
                {t("trades.addFirst")}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-border bg-muted/20 hover:bg-muted/20">
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">{t("table.image")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.date")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.symbol")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.type")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.strategy")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.confirmations")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.tags")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.rr")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.pnl")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{t("table.rating")}</TableHead>
                  <TableHead className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-12">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade, index) => {
                  const confirmations = getTradeConfirmations(trade.id);
                  return (
                    <TableRow
                      key={trade.id}
                      className={cn(
                        "border-border cursor-pointer transition-colors duration-150",
                        index % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                        "hover:bg-primary/5"
                      )}
                      onClick={() => handleTradeClick(trade)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {trade.screenshot_url ? (
                          <div
                            className="w-14 h-10 rounded-md overflow-hidden border border-border cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setImagePreview(trade.screenshot_url)}
                          >
                            <img src={trade.screenshot_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-10 rounded-md bg-muted/30 flex items-center justify-center border border-border/50">
                            <Image className="h-4 w-4 text-muted-foreground/50" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {formatDate(trade.entry_date || trade.created_at)}
                      </TableCell>
                      <TableCell className="font-semibold">{trade.symbol}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${trade.trade_type === "long" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}
                        >
                          {trade.trade_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{trade.strategy || "—"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1 max-w-[200px] items-center">
                          {confirmations.slice(0, 3).map((conf, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20 group"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {conf}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConfirmation(trade.id, conf);
                                }}
                                className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          {confirmations.length > 3 && (
                            <span className="text-xs text-muted-foreground">+{confirmations.length - 3}</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddConfirmation(trade.id);
                            }}
                            className="inline-flex items-center justify-center h-5 w-5 rounded text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                            title="הוסף אישור"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(trade as any).mental_state && ((trade as any).mental_state as string).split(",").map((ms: string) => {
                            const trimmed = ms.trim();
                            const info = getMentalStateInfo(trimmed);
                            if (!info) return null;
                            const Icon = info.icon;
                            return (
                              <span key={trimmed} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${info.color}`}>
                                <Icon className="h-3 w-3" />
                                {info.label}
                              </span>
                            );
                          })}
                          {(trade as any).setup_type && ((trade as any).setup_type as string).split(",").map((st: string) => {
                            const trimmed = st.trim();
                            return (
                              <span key={trimmed} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/30">
                                {trimmed}
                              </span>
                            );
                          })}
                          {((trade as any).mistakes || []).slice(0, 2).map((m: string, i: number) => (
                            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/10 text-orange-400 border border-orange-500/30">
                              {m}
                            </span>
                          ))}
                          {((trade as any).mistakes || []).length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{((trade as any).mistakes || []).length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{trade.rr ? trade.rr.toFixed(2) : "—"}</TableCell>
                      <TableCell className={`font-bold ${(trade.pnl || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatPnl(trade.pnl)}
                      </TableCell>
                      <TableCell>{renderRating(trade.rating)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              {deletingTradeId === trade.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("trades.deleteTrade")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("trades.deleteTradeConfirm")} {trade.symbol}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("general.cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTrade(trade.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </Card>

        {/* Image Preview Dialog */}
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-4xl p-2">
            {imagePreview && <img src={imagePreview} alt="Trade screenshot" className="w-full h-auto rounded-lg" />}
          </DialogContent>
        </Dialog>
      </div>

      <AddTradeDialog open={isAddTradeOpen} onOpenChange={setIsAddTradeOpen} onTradeAdded={fetchTrades} />

      <CSVImportDialog open={isCSVImportOpen} onOpenChange={setIsCSVImportOpen} onImportComplete={fetchTrades} />

      <TradeSummaryDialog
        trade={selectedTrade}
        open={isSummaryOpen}
        onOpenChange={setIsSummaryOpen}
        onEdit={handleEditFromSummary}
        confirmations={selectedTrade ? getTradeConfirmations(selectedTrade.id) : []}
        screenshots={selectedTrade ? getTradeScreenshots(selectedTrade.id) : []}
      />

      <EditTradeDialog
        trade={selectedTrade}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onTradeUpdated={fetchTrades}
      />

      {/* Add Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onOpenChange={setConfirmationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">הוסף אישור</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Strategy confirmations selector */}
            {strategies.length > 0 && (
              <div className="space-y-2">
                <Label className="text-right">בחר מאסטרטגיה קיימת</Label>
                <Select 
                  value={selectedStrategyForConfirmation} 
                  onValueChange={(value) => {
                    setSelectedStrategyForConfirmation(value);
                    if (value !== "custom") {
                      setNewConfirmationName(value);
                    } else {
                      setNewConfirmationName("");
                    }
                  }}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר אישור מאסטרטגיה..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">הזן ידנית</SelectItem>
                    {strategies.flatMap(strategy => 
                      strategy.confirmations.map(conf => (
                        <SelectItem key={conf.id} value={conf.name}>
                          {strategy.name}: {conf.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom confirmation input */}
            {(selectedStrategyForConfirmation === "custom" || selectedStrategyForConfirmation === "" || strategies.length === 0) && (
              <div className="space-y-2">
                <Label htmlFor="confirmation-name" className="text-right">שם האישור</Label>
                <Input
                  id="confirmation-name"
                  value={newConfirmationName}
                  onChange={(e) => setNewConfirmationName(e.target.value)}
                  placeholder="הזן שם אישור..."
                  className="text-right"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveConfirmation();
                    }
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmationDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSaveConfirmation} disabled={!newConfirmationName.trim()}>
              הוסף
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Trades;
