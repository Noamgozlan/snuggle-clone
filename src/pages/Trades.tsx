import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { AddTradeDialog } from "@/components/trades/AddTradeDialog";
import { EditTradeDialog } from "@/components/trades/EditTradeDialog";
import { TradeSummaryDialog } from "@/components/trades/TradeSummaryDialog";
import { CSVImportDialog } from "@/components/trades/CSVImportDialog";
import { useTrades, Trade } from "@/hooks/useTrades";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
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
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TradeConfirmation {
  trade_id: string;
  confirmation_name: string;
}

interface TradeScreenshot {
  id: string;
  trade_id: string;
  screenshot_url: string;
  position: number;
}

const Trades = () => {
  const { trades, stats, loading, fetchTrades, deleteTrade, deleteAllTrades } = useTrades();
  const [deletingTradeId, setDeletingTradeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
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
        .select("id, trade_id, screenshot_url, position")
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
        title: "כל העסקאות נמחקו",
        description: "כל העסקאות הוסרו מהמערכת",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את העסקאות",
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
        title: "העסקה נמחקה",
        description: "העסקה הוסרה בהצלחה",
      });
    } else {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את העסקה",
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
    <DashboardLayout title="עסקאות">
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
              <span className="hidden sm:inline">הוסף עסקה</span>
              <span className="sm:hidden">הוסף</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 hover:scale-105 transition-transform"
              onClick={() => setIsCSVImportOpen(true)}
            >
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">יבוא CSV</span>
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
                  <span className="hidden sm:inline">מחק הכל</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                  <AlertDialogDescription>
                    פעולה זו תמחק את כל העסקאות שלך לצמיתות. לא ניתן לבטל פעולה זו.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAll} disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "מחק הכל"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <span className="text-xs md:text-sm text-muted-foreground">{filteredTrades.length} עסקאות</span>
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
                  {fromDate ? format(fromDate, "dd/MM/yy") : "מתאריך"}
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
                  {toDate ? format(toDate, "dd/MM/yy") : "עד תאריך"}
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
                כסף $
              </Button>
              <Button variant="secondary" size="sm">
                נקודות
              </Button>
            </div>
            <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
              <Filter className="h-4 w-4 md:ml-2" />
              <span className="hidden md:inline">מסננים</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 stagger-children">
          <Card className="bg-card border-border p-4 hover-lift">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">רווח/הפסד מצטבר נטו</p>
                <p
                  className={`text-2xl font-bold animate-bounce-in ${stats.totalPnl >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}
                </p>
                <span
                  className={`inline-block w-2 h-2 rounded-full ml-2 animate-pulse ${stats.totalPnl >= 0 ? "bg-success" : "bg-destructive"}`}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <div
                className="h-2 bg-destructive rounded-full transition-all duration-500"
                style={{ width: `${stats.totalTrades > 0 ? (stats.losingTrades / stats.totalTrades) * 100 : 50}%` }}
              />
              <div
                className="h-2 bg-success rounded-full transition-all duration-500"
                style={{ width: `${stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 50}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>הפסד ({stats.losingTrades})</span>
              <span>רווח ({stats.winningTrades})</span>
            </div>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col items-center justify-center hover-lift">
            <p className="text-sm text-muted-foreground mb-2">זכייה מרבית/הפסד מקסימלי</p>
            <p className="text-3xl font-bold text-foreground animate-scale-in">
              {stats.maxLoss !== 0 ? Math.abs(stats.maxWin / stats.maxLoss).toFixed(2) : "—"}
            </p>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col items-center justify-center hover-lift">
            <p className="text-sm text-muted-foreground mb-2">אחוז הצלחה</p>
            <div className="animate-scale-in">
              <ProgressRing value={stats.winRate} size={80} strokeWidth={6} />
            </div>
          </Card>

          <Card className="bg-card border-border p-4 flex flex-col items-center justify-center hover-lift">
            <p className="text-sm text-muted-foreground mb-2">Avg RR</p>
            <p className="text-3xl font-bold text-foreground animate-scale-in">{stats.avgRR.toFixed(2)}</p>
          </Card>
        </div>

        {/* Trades Table */}
        <Card className="bg-card border-border hover-glow animate-slide-up">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : trades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">אין עסקאות להצגה</p>
              <Button variant="default" className="bg-primary" onClick={() => setIsAddTradeOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                הוסף עסקה ראשונה
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-right text-muted-foreground w-16">תמונה</TableHead>
                  <TableHead className="text-right text-muted-foreground">תאריך</TableHead>
                  <TableHead className="text-right text-muted-foreground">סימול</TableHead>
                  <TableHead className="text-right text-muted-foreground">סוג</TableHead>
                  <TableHead className="text-right text-muted-foreground">אסטרטגיה</TableHead>
                  <TableHead className="text-right text-muted-foreground">אישורים</TableHead>
                  <TableHead className="text-right text-muted-foreground">RR</TableHead>
                  <TableHead className="text-right text-muted-foreground">רווח/הפסד</TableHead>
                  <TableHead className="text-right text-muted-foreground">דירוג</TableHead>
                  <TableHead className="text-right text-muted-foreground w-12">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade, index) => {
                  const confirmations = getTradeConfirmations(trade.id);
                  return (
                    <TableRow
                      key={trade.id}
                      className="border-border hover:bg-secondary/50 transition-colors cursor-pointer animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
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
                      <TableCell>
                        {confirmations.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {confirmations.slice(0, 3).map((conf, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                {conf}
                              </span>
                            ))}
                            {confirmations.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{confirmations.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
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
                              <AlertDialogTitle>מחק עסקה</AlertDialogTitle>
                              <AlertDialogDescription>
                                האם אתה בטוח שברצונך למחוק את העסקה על {trade.symbol}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
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
    </DashboardLayout>
  );
};

export default Trades;
