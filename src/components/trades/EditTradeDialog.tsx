import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Star, Upload, Loader2, X, Layers, Clock } from "lucide-react";
import { TradeTagsSection } from "@/components/trades/TradeTagsSection";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trade } from "@/hooks/useTrades";
import { usePortfolio } from "@/contexts/PortfolioContext";

interface EditTradeDialogProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTradeUpdated?: () => void;
}

export const EditTradeDialog = ({ trade, open, onOpenChange, onTradeUpdated }: EditTradeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [tradeType, setTradeType] = useState<"long" | "short">("long");
  const [pnlSign, setPnlSign] = useState<"positive" | "negative">("positive");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [screenshots, setScreenshots] = useState<{ url: string; preview: string; timeframe: string }[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("15m");
  
  const TIMEFRAME_OPTIONS = [
    { value: "1m", label: "1 דקה" },
    { value: "5m", label: "5 דקות" },
    { value: "15m", label: "15 דקות" },
    { value: "30m", label: "30 דקות" },
    { value: "1h", label: "שעה" },
    { value: "4h", label: "4 שעות" },
    { value: "1d", label: "יום" },
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { portfolios } = usePortfolio();
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([]);
  const [session, setSession] = useState<string>("");
  const [mentalStates, setMentalStates] = useState<string[]>([]);
  const [tradeMistakes, setTradeMistakes] = useState<string[]>([]);
  const [setupTypes, setSetupTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "1",
    tradeDate: "",
    durationHours: "",
    durationMinutes: "",
    durationSeconds: "",
    entryPrice: "",
    exitPrice: "",
    pnl: "",
    pnlPoints: "",
    risk: "",
    rr: "",
    strategy: "",
    entryReason: "",
    conclusions: "",
  });

  // Track if we've initialized for this trade to prevent resetting on re-renders
  const [initializedForTradeId, setInitializedForTradeId] = useState<string | null>(null);

  // Load trade data when dialog opens with a new trade
  useEffect(() => {
    if (trade && open && initializedForTradeId !== trade.id) {
      const pnl = trade.pnl || 0;
      const fullNotes = trade.notes || "";
      const [reason, ...rest] = fullNotes.split("\n\n[CONCLUSIONS]\n");

      // Calculate duration from entry and exit dates
      let hours = "";
      let minutes = "";
      let seconds = "";
      if (trade.entry_date && trade.exit_date) {
        const entry = new Date(trade.entry_date);
        const exit = new Date(trade.exit_date);
        const diffMs = exit.getTime() - entry.getTime();
        if (diffMs > 0) {
          const totalSeconds = Math.floor(diffMs / 1000);
          hours = String(Math.floor(totalSeconds / 3600));
          minutes = String(Math.floor((totalSeconds % 3600) / 60));
          seconds = String(totalSeconds % 60);
        }
      }

      setFormData({
        symbol: trade.symbol || "",
        quantity: String(trade.quantity || 1),
        tradeDate: trade.entry_date ? trade.entry_date.split("T")[0] : "",
        durationHours: hours,
        durationMinutes: minutes,
        durationSeconds: seconds,
        entryPrice: trade.entry_price !== null && trade.entry_price !== undefined ? String(trade.entry_price) : "",
        exitPrice: trade.exit_price !== null && trade.exit_price !== undefined ? String(trade.exit_price) : "",
        pnl: pnl !== 0 ? String(Math.abs(pnl)) : "",
        pnlPoints: trade.pnl_points !== null && trade.pnl_points !== undefined ? String(trade.pnl_points) : "",
        risk: trade.risk !== null && trade.risk !== undefined ? String(trade.risk) : "",
        rr: trade.rr !== null && trade.rr !== undefined ? String(trade.rr) : "",
        strategy: trade.strategy || "",
        entryReason: reason || "",
        conclusions: rest.join("\n\n[CONCLUSIONS]\n") || "",
      });
      setRating(trade.rating || 0);
      setTradeType((trade.trade_type as "long" | "short") || "long");
      setPnlSign(pnl >= 0 ? "positive" : "negative");
      setSelectedPortfolioIds(trade.portfolio_id ? [trade.portfolio_id] : []);
      setSession((trade as any).session || "");
      const msVal = (trade as any).mental_state || "";
      setMentalStates(msVal ? msVal.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
      setTradeMistakes((trade as any).mistakes || []);
      const stVal = (trade as any).setup_type || "";
      setSetupTypes(stVal ? stVal.split(",").map((s: string) => s.trim()).filter(Boolean) : []);
      
      // Load existing screenshots
      if (trade.screenshot_url) {
        setScreenshots([{ url: trade.screenshot_url, preview: trade.screenshot_url, timeframe: "15m" }]);
      } else {
        setScreenshots([]);
      }
      
      // Fetch screenshots from trade_screenshots table
      const fetchScreenshots = async () => {
        const { data, error } = await supabase
          .from("trade_screenshots")
          .select("screenshot_url, position, timeframe")
          .eq("trade_id", trade.id)
          .order("position", { ascending: true });
          
        if (!error && data && data.length > 0) {
          setScreenshots(data.map(ss => ({ 
            url: ss.screenshot_url, 
            preview: ss.screenshot_url,
            timeframe: ss.timeframe || "15m"
          })));
        }
      };
      fetchScreenshots();
      
      setInitializedForTradeId(trade.id);
    }
    
    // Reset tracking when dialog closes
    if (!open) {
      setInitializedForTradeId(null);
    }
  }, [trade, open, initializedForTradeId]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploadingImage(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const reader = new FileReader();
        const previewPromise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const preview = await previewPromise;

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("trade-screenshots").upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("trade-screenshots").getPublicUrl(fileName);

        setScreenshots(prev => [...prev, { url: publicUrl, preview, timeframe: selectedTimeframe }]);
      }
      
      toast({
        title: files.length > 1 ? `${files.length} תמונות הועלו בהצלחה` : "התמונה הועלתה בהצלחה",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "שגיאה בהעלאת התמונה", variant: "destructive" });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !trade) {
      toast({ title: "שגיאה", description: "יש להתחבר כדי לערוך עסקאות", variant: "destructive" });
      return;
    }

    if (!formData.symbol) {
      toast({ title: "שגיאה", description: "יש למלא סימול", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      let entryDate = null;
      let exitDate = null;
      if (formData.tradeDate) {
        entryDate = `${formData.tradeDate}T12:00:00`;
        
        // Calculate exit date based on duration - start from entry time (12:00:00) and add duration
        if (formData.durationHours || formData.durationMinutes || formData.durationSeconds) {
          const hours = parseInt(formData.durationHours) || 0;
          const minutes = parseInt(formData.durationMinutes) || 0;
          const seconds = parseInt(formData.durationSeconds) || 0;

          const entryDateTime = new Date(`${formData.tradeDate}T12:00:00`);
          entryDateTime.setHours(entryDateTime.getHours() + hours);
          entryDateTime.setMinutes(entryDateTime.getMinutes() + minutes);
          entryDateTime.setSeconds(entryDateTime.getSeconds() + seconds);
          exitDate = entryDateTime.toISOString();
        }
      }

      const pnlValue = formData.pnl
        ? pnlSign === "negative"
          ? -Math.abs(parseFloat(formData.pnl))
          : Math.abs(parseFloat(formData.pnl))
        : null;

      const combinedNotes =
        formData.entryReason || formData.conclusions
          ? `${formData.entryReason || ""}\n\n[CONCLUSIONS]\n${formData.conclusions || ""}`.trim()
          : null;

      const { error } = await supabase
        .from("trades")
        .update({
          symbol: formData.symbol.toUpperCase(),
          trade_type: tradeType,
          quantity: parseFloat(formData.quantity) || 1,
          entry_date: entryDate,
          exit_date: exitDate,
          entry_price: formData.entryPrice ? parseFloat(formData.entryPrice) : null,
          exit_price: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
          pnl: pnlValue,
          pnl_points: formData.pnlPoints ? parseFloat(formData.pnlPoints) : null,
          risk: formData.risk ? parseFloat(formData.risk) : null,
          rr: formData.rr ? parseFloat(formData.rr) : null,
          rating: rating || null,
          strategy: formData.strategy || null,
          session: session || null,
          notes: combinedNotes,
          is_closed: true,
          screenshot_url: screenshots.length > 0 ? screenshots[0].url : null,
          mental_state: mentalStates.length > 0 ? mentalStates.join(",") : null,
          mistakes: tradeMistakes.length > 0 ? tradeMistakes : null,
          setup_type: setupTypes.length > 0 ? setupTypes.join(",") : null,
        } as any)
        .eq("id", trade.id);

      if (error) throw error;

      // Update screenshots in trade_screenshots table
      // First delete existing
      await supabase.from("trade_screenshots").delete().eq("trade_id", trade.id);
      
      // Then insert new ones
      if (screenshots.length > 0) {
        const screenshotsToInsert = screenshots.map((ss, index) => ({
          trade_id: trade.id,
          screenshot_url: ss.url,
          position: index,
          timeframe: ss.timeframe,
        }));
        await supabase.from("trade_screenshots").insert(screenshotsToInsert);
      }

      // Check if user wants to sync to OTHER portfolios (creating copies)
      const otherPortfolioIds = selectedPortfolioIds.filter((id) => id !== trade.portfolio_id);

      if (otherPortfolioIds.length > 0) {
        const tradesToInsert = otherPortfolioIds.map((portfolioId) => ({
          user_id: user.id,
          portfolio_id: portfolioId,
          symbol: formData.symbol.toUpperCase(),
          trade_type: tradeType,
          quantity: parseFloat(formData.quantity) || 1,
          entry_date: entryDate,
          entry_price: formData.entryPrice ? parseFloat(formData.entryPrice) : 0,
          exit_price: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
          pnl: pnlValue,
          pnl_points: formData.pnlPoints ? parseFloat(formData.pnlPoints) : null,
          risk: formData.risk ? parseFloat(formData.risk) : null,
          rr: formData.rr ? parseFloat(formData.rr) : null,
          rating: rating || null,
          strategy: formData.strategy || null,
          session: session || null,
          notes: combinedNotes,
          is_closed: true,
          screenshot_url: screenshots.length > 0 ? screenshots[0].url : null,
        }));

        const { error: syncError } = await supabase.from("trades").insert(tradesToInsert);
        if (syncError) {
          console.error("Error syncing trade to other portfolios:", syncError);
          toast({
            title: "שגיאה בסנכרון",
            description: "העסקה המקורית עודכנה, אך לא ניתן היה לסנכרן לתיקים נוספים",
            variant: "destructive",
          });
        }
      }

      toast({ title: "העסקה עודכנה בהצלחה!", description: `${formData.symbol} - ${tradeType.toUpperCase()}` });
      onOpenChange(false);
      onTradeUpdated?.();
    } catch (error) {
      console.error("Error updating trade:", error);
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את העסקה", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">ערוך עסקה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סימול *</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-input border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">כמות</Label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">כיוון</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={tradeType === "short" ? "destructive" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setTradeType("short")}
                >
                  S
                </Button>
                <Button
                  type="button"
                  variant={tradeType === "long" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setTradeType("long")}
                >
                  L
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">תאריך עסקה</Label>
              <Input
                type="date"
                value={formData.tradeDate}
                onChange={(e) => setFormData({ ...formData, tradeDate: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סשן מסחר</Label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="בחר סשן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asia">אסיה</SelectItem>
                  <SelectItem value="london">לונדון</SelectItem>
                  <SelectItem value="new_york">ניו יורק</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">משך העסקה</Label>
              <div className="flex gap-1 items-center">
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                    className="bg-input border-border text-center w-14"
                  />
                  <span className="text-[10px] text-muted-foreground">שעות</span>
                </div>
                <span className="text-muted-foreground">:</span>
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    className="bg-input border-border text-center w-14"
                  />
                  <span className="text-[10px] text-muted-foreground">דקות</span>
                </div>
                <span className="text-muted-foreground">:</span>
                <div className="flex flex-col items-center">
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={formData.durationSeconds}
                    onChange={(e) => setFormData({ ...formData, durationSeconds: e.target.value })}
                    className="bg-input border-border text-center w-14"
                  />
                  <span className="text-[10px] text-muted-foreground">שניות</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">מחיר כניסה</Label>
              <Input
                type="number"
                step="any"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">מחיר יציאה</Label>
              <Input
                type="number"
                step="any"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">נקודות</Label>
              <Input
                type="number"
                step="any"
                value={formData.pnlPoints}
                onChange={(e) => setFormData({ ...formData, pnlPoints: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-muted-foreground text-sm">רווח/הפסד ($)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={pnlSign === "negative" ? "destructive" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full flex-shrink-0"
                  onClick={() => setPnlSign("negative")}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  step="any"
                  value={formData.pnl}
                  onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                  className={cn(
                    "font-bold text-center text-lg",
                    pnlSign === "positive"
                      ? "bg-success/20 border-success/30 text-success"
                      : "bg-destructive/20 border-destructive/30 text-destructive",
                  )}
                />
                <Button
                  type="button"
                  variant={pnlSign === "positive" ? "default" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full flex-shrink-0"
                  onClick={() => setPnlSign("positive")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סיכון ($)</Label>
              <Input
                type="number"
                step="any"
                value={formData.risk}
                onChange={(e) => setFormData({ ...formData, risk: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">RR (Risk to Reward)</Label>
              <Input
                type="number"
                step="any"
                value={formData.rr}
                onChange={(e) => setFormData({ ...formData, rr: e.target.value })}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">דירוג</Label>
              <div className="flex items-center gap-1 p-2 bg-input border border-border rounded-lg">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star === rating ? 0 : star)}
                    className="hover:scale-125 transition-transform"
                  >
                    <Star
                      className={cn(
                        "h-5 w-5 transition-colors",
                        star <= rating ? "fill-warning text-warning" : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-muted-foreground text-sm">אסטרטגיה</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  className="bg-input border-border flex-1"
                />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "bg-input border-border gap-2 whitespace-nowrap px-3",
                        selectedPortfolioIds.length > 1 && "border-primary/50 bg-primary/5",
                      )}
                    >
                      <Layers className="h-4 w-4 text-primary" />
                      <span className="hidden sm:inline">סנכרון תיקים</span>
                      {selectedPortfolioIds.length > 1 && (
                        <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">
                          {selectedPortfolioIds.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-card border-border" align="end">
                    <h4 className="font-medium text-sm mb-3 text-right">סנכרן עם תיקים נוספים</h4>
                    <p className="text-[10px] text-muted-foreground mb-3 text-right">
                      בחירת תיקים נוספים תיצור עותק של העסקה בהם
                    </p>
                    <div className="space-y-2">
                      {portfolios.map((portfolio) => (
                        <div key={portfolio.id} className="flex items-center gap-2 justify-end">
                          <Label htmlFor={`sync-edit-${portfolio.id}`} className="text-sm cursor-pointer order-1">
                            {portfolio.name}
                          </Label>
                          <Checkbox
                            id={`sync-edit-${portfolio.id}`}
                            checked={selectedPortfolioIds.includes(portfolio.id)}
                            className="order-2"
                            onCheckedChange={(checked) => {
                              setSelectedPortfolioIds((prev) =>
                                checked ? [...prev, portfolio.id] : prev.filter((id) => id !== portfolio.id),
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <TradeTagsSection
            mentalState={mentalState}
            onMentalStateChange={setMentalState}
            mistakes={tradeMistakes}
            onMistakesChange={setTradeMistakes}
            setupType={setupType}
            onSetupTypeChange={setSetupType}
          />

          {/* Notes & Screenshot */}
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סיבת כניסה לעסקה</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-secondary/30 border-b border-border">
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors">
                    <span className="font-bold text-sm">B</span>
                  </button>
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors">
                    <span className="italic text-sm">I</span>
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors text-sm">
                    גדול
                  </button>
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors text-sm">
                    קטן
                  </button>
                </div>
                <Textarea
                  placeholder="למה נכנסת לעסקה? מה היו הסיגנלים?"
                  value={formData.entryReason}
                  onChange={(e) => setFormData({ ...formData, entryReason: e.target.value })}
                  className="bg-input border-0 min-h-[120px] max-h-[200px] overflow-y-auto resize-none focus-visible:ring-0 text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">מסקנות לאחר העסקה</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-1 p-2 bg-secondary/30 border-b border-border">
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors">
                    <span className="font-bold text-sm">B</span>
                  </button>
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors">
                    <span className="italic text-sm">I</span>
                  </button>
                  <div className="w-px h-4 bg-border mx-1" />
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors text-sm">
                    גדול
                  </button>
                  <button type="button" className="p-1 hover:bg-secondary rounded transition-colors text-sm">
                    קטן
                  </button>
                </div>
                <Textarea
                  placeholder="מה למדת מהעסקה? מה היית עושה אחרת?"
                  value={formData.conclusions}
                  onChange={(e) => setFormData({ ...formData, conclusions: e.target.value })}
                  className="bg-input border-0 min-h-[120px] max-h-[200px] overflow-y-auto resize-none focus-visible:ring-0 text-right"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-muted-foreground text-sm">צילומי מסך</Label>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleImageUpload} 
              className="hidden" 
            />
            
            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {screenshots.map((ss, index) => (
                  <div key={index} className="relative border border-border rounded-lg overflow-hidden aspect-video group">
                    <img
                      src={ss.preview}
                      alt={`צילום מסך ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Timeframe badge */}
                    <div className="absolute bottom-1 left-1 px-2 py-0.5 bg-background/90 backdrop-blur-sm rounded text-xs font-medium border border-border flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {TIMEFRAME_OPTIONS.find(t => t.value === ss.timeframe)?.label || ss.timeframe}
                    </div>
                    {/* Change timeframe dropdown */}
                    <div className="absolute top-1 left-1">
                      <Select 
                        value={ss.timeframe} 
                        onValueChange={(value) => {
                          setScreenshots(prev => prev.map((s, i) => 
                            i === index ? { ...s, timeframe: value } : s
                          ));
                        }}
                      >
                        <SelectTrigger className="h-6 w-16 text-[10px] bg-background/90 backdrop-blur-sm border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEFRAME_OPTIONS.map(tf => (
                            <SelectItem key={tf.value} value={tf.value} className="text-xs">
                              {tf.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Timeframe selector for new uploads */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">טיימפריים לתמונה הבאה:</span>
              </div>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAME_OPTIONS.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    {screenshots.length > 0 ? "הוסף עוד תמונות" : "לחץ להעלאת צילומי מסך"}
                  </span>
                  <span className="text-xs text-muted-foreground/70 mt-1">ניתן לבחור מספר תמונות</span>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור שינויים"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
