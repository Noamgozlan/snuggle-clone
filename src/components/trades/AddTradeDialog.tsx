import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Minus, Star, Upload, Loader2, X, CalendarIcon, Layers, Sparkles } from "lucide-react";
import { TradeTagsSection } from "@/components/trades/TradeTagsSection";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useStrategies, Strategy } from "@/hooks/useStrategies";
import { usePortfolio } from "@/contexts/PortfolioContext";

interface AddTradeDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTradeAdded?: () => void;
}

export const AddTradeDialog = ({ trigger, open, onOpenChange, onTradeAdded }: AddTradeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { strategies } = useStrategies();
  const { activePortfolio } = usePortfolio();
  const [rating, setRating] = useState(0);
  const [tradeType, setTradeType] = useState<"long" | "short">("long");
  const [pnlSign, setPnlSign] = useState<"positive" | "negative">("positive");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [screenshots, setScreenshots] = useState<{ url: string; preview: string; timeframe: string }[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("15m");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedConfirmations, setSelectedConfirmations] = useState<string[]>([]);
  const [riskType, setRiskType] = useState<"dollars" | "percent">("dollars");
  const { portfolios } = usePortfolio();
  const [selectedPortfolioIds, setSelectedPortfolioIds] = useState<string[]>([]);
  const [isBreakeven, setIsBreakeven] = useState(false);
  const [improvingEntryReason, setImprovingEntryReason] = useState(false);
  const [improvingConclusions, setImprovingConclusions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tradeDate, setTradeDate] = useState<Date>(new Date());

  // Always sync with active portfolio when it changes
  useEffect(() => {
    if (activePortfolio) {
      setSelectedPortfolioIds([activePortfolio.id]);
    }
  }, [activePortfolio]);

  // Also sync when dialog opens
  useEffect(() => {
    if (open && activePortfolio) {
      setSelectedPortfolioIds([activePortfolio.id]);
    }
  }, [open, activePortfolio]);

  const [session, setSession] = useState<string>("");
  const [mentalStates, setMentalStates] = useState<string[]>([]);
  const [tradeMistakes, setTradeMistakes] = useState<string[]>([]);
  const [setupTypes, setSetupTypes] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "1",
    durationHours: "",
    durationMinutes: "",
    durationSeconds: "",
    entryPrice: "",
    exitPrice: "",
    pnl: "",
    pnlPoints: "",
    risk: "",
    rr: "",
    entryReason: "",
    conclusions: "",
  });

  const resetForm = () => {
    setFormData({
      symbol: "",
      quantity: "1",
      durationHours: "",
      durationMinutes: "",
      durationSeconds: "",
      entryPrice: "",
      exitPrice: "",
      pnl: "",
      pnlPoints: "",
      risk: "",
      rr: "",
      entryReason: "",
      conclusions: "",
    });
    setTradeDate(new Date());
    setRating(0);
    setTradeType("long");
    setPnlSign("positive");
    setScreenshots([]);
    setSelectedStrategy(null);
    setSelectedConfirmations([]);
    setRiskType("dollars");
    setSelectedPortfolioIds(activePortfolio ? [activePortfolio.id] : []);
    setIsBreakeven(false);
    setSession("");
    setMentalState("");
    setTradeMistakes([]);
    setSetupType("");
  };

  const handleStrategyChange = (strategyId: string) => {
    const strategy = strategies.find((s) => s.id === strategyId) || null;
    setSelectedStrategy(strategy);
    setSelectedConfirmations([]);
  };

  const toggleConfirmation = (confName: string) => {
    setSelectedConfirmations((prev) =>
      prev.includes(confName) ? prev.filter((c) => c !== confName) : [...prev, confName],
    );
  };

  const improveTextWithAI = async (type: "entry_reason" | "conclusions") => {
    const text = type === "entry_reason" ? formData.entryReason : formData.conclusions;
    
    if (!text || text.trim().length === 0) {
      toast({
        title: "לא הוזן טקסט",
        description: "יש להזין טקסט לפני שניתן לשפר אותו",
        variant: "destructive",
      });
      return;
    }

    if (type === "entry_reason") {
      setImprovingEntryReason(true);
    } else {
      setImprovingConclusions(true);
    }

    try {
      const { data, error } = await supabase.functions.invoke("improve-trade-text", {
        body: { text, type },
      });

      if (error) throw error;

      if (data?.improved_text) {
        if (type === "entry_reason") {
          setFormData((prev) => ({ ...prev, entryReason: data.improved_text }));
        } else {
          setFormData((prev) => ({ ...prev, conclusions: data.improved_text }));
        }
        toast({
          title: "הטקסט שופר בהצלחה!",
        });
      }
    } catch (error: any) {
      console.error("Error improving text:", error);
      toast({
        title: "שגיאה בשיפור הטקסט",
        description: error?.message || "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    } finally {
      if (type === "entry_reason") {
        setImprovingEntryReason(false);
      } else {
        setImprovingConclusions(false);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploadingImage(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Show preview immediately
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

        setScreenshots((prev) => [...prev, { url: publicUrl, preview, timeframe: selectedTimeframe }]);
      }

      toast({
        title: files.length > 1 ? `${files.length} תמונות הועלו בהצלחה` : "התמונה הועלתה בהצלחה",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "שגיאה בהעלאת התמונה",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי להוסיף עסקאות",
        variant: "destructive",
      });
      return;
    }

    if (!formData.symbol) {
      toast({
        title: "שגיאה",
        description: "יש למלא סימול",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      // Build entry date from selected date - use local date components to avoid timezone issues
      const year = tradeDate.getFullYear();
      const month = String(tradeDate.getMonth() + 1).padStart(2, "0");
      const day = String(tradeDate.getDate()).padStart(2, "0");
      const tradeDateStr = `${year}-${month}-${day}`;
      const entryDate = `${tradeDateStr}T12:00:00`; // Use noon to avoid timezone edge cases

      // Calculate exit date based on duration - start from entry time and add duration
      let exitDate = null;
      if (formData.durationHours || formData.durationMinutes || formData.durationSeconds) {
        const hours = parseInt(formData.durationHours) || 0;
        const minutes = parseInt(formData.durationMinutes) || 0;
        const seconds = parseInt(formData.durationSeconds) || 0;

        // Start from entry date (T12:00:00) and add duration
        const entryDateTime = new Date(`${tradeDateStr}T12:00:00`);
        entryDateTime.setHours(entryDateTime.getHours() + hours);
        entryDateTime.setMinutes(entryDateTime.getMinutes() + minutes);
        entryDateTime.setSeconds(entryDateTime.getSeconds() + seconds);
        exitDate = entryDateTime.toISOString();
      }

      // Calculate PnL with sign (0 if breakeven)
      let pnlValue: number | null = null;
      if (isBreakeven) {
        pnlValue = 0;
      } else if (formData.pnl) {
        pnlValue = pnlSign === "negative" ? -Math.abs(parseFloat(formData.pnl)) : Math.abs(parseFloat(formData.pnl));
      }

      // Sync across selected portfolios
      const portfoliosToCreate = selectedPortfolioIds.length > 0 ? selectedPortfolioIds : [activePortfolio?.id || null];

      for (const portfolioId of portfoliosToCreate) {
        const { data: tradeData, error } = await supabase
          .from("trades")
          .insert({
            user_id: user.id,
            portfolio_id: portfolioId,
            symbol: formData.symbol.toUpperCase(),
            trade_type: tradeType,
            quantity: parseFloat(formData.quantity) || 1,
            entry_date: entryDate,
            exit_date: exitDate,
            entry_price: formData.entryPrice ? parseFloat(formData.entryPrice) : 0,
            exit_price: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
            pnl: pnlValue,
            pnl_points: formData.pnlPoints ? parseFloat(formData.pnlPoints) : null,
            risk: formData.risk ? parseFloat(formData.risk) : null,
            rr: formData.rr ? parseFloat(formData.rr) : null,
            rating: rating || null,
            strategy: selectedStrategy?.name || null,
            session: session || null,
            notes:
              formData.entryReason || formData.conclusions
                ? `${formData.entryReason || ""}\n\n[CONCLUSIONS]\n${formData.conclusions || ""}`.trim()
                : null,
            is_closed: true,
            screenshot_url: screenshots.length > 0 ? screenshots[0].url : null,
            mental_state: mentalState || null,
            mistakes: tradeMistakes.length > 0 ? tradeMistakes : null,
            setup_type: setupType || null,
          } as any)
          .select("id")
          .single();

        if (error) throw error;

        // Save all screenshots to trade_screenshots table
        if (tradeData && screenshots.length > 0) {
          const screenshotsToInsert = screenshots.map((ss, index) => ({
            trade_id: tradeData.id,
            screenshot_url: ss.url,
            position: index,
            timeframe: ss.timeframe,
          }));

          const { error: ssError } = await supabase.from("trade_screenshots").insert(screenshotsToInsert);
          if (ssError) {
            console.error("Error saving screenshots:", ssError);
          }
        }

        // Save selected confirmations for this trade
        if (tradeData && selectedConfirmations.length > 0) {
          const confirmationsToInsert = selectedConfirmations.map((confName) => ({
            trade_id: tradeData.id,
            confirmation_name: confName,
          }));

          const { error: confError } = await supabase.from("trade_confirmations").insert(confirmationsToInsert);

          if (confError) {
            console.error("Error saving confirmations:", confError);
          }
        }
      }

      toast({
        title: "העסקה נוספה בהצלחה!",
        description: `${formData.symbol} - ${tradeType.toUpperCase()}`,
      });

      resetForm();
      onOpenChange?.(false);
      onTradeAdded?.();
    } catch (error) {
      console.error("Error adding trade:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את העסקה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border animate-scale-in">
        <DialogHeader className="animate-fade-in">
          <DialogTitle className="text-xl font-bold text-right">הוסף עסקה חדשה</DialogTitle>
          <p className="text-sm text-muted-foreground text-right">הזן את פרטי העסקה להלן</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Row 1: Symbol, Quantity, Direction, Entry/Exit Times */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 stagger-children">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סימול *</Label>
              <Input
                placeholder="NQ, ES..."
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="bg-input border-border hover:border-primary/50 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">כמות</Label>
              <Input
                type="number"
                min="0.0001"
                step="any"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="bg-input border-border hover:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סשן מסחר</Label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger className="bg-input border-border hover:border-primary/50 transition-colors">
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
              <Label className="text-muted-foreground text-sm">כיוון</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={tradeType === "short" ? "destructive" : "outline"}
                  size="sm"
                  className={cn("flex-1 transition-all duration-200", tradeType === "short" && "scale-105")}
                  onClick={() => setTradeType("short")}
                >
                  S
                </Button>
                <Button
                  type="button"
                  variant={tradeType === "long" ? "default" : "outline"}
                  size="sm"
                  className={cn("flex-1 transition-all duration-200", tradeType === "long" && "scale-105 bg-primary")}
                  onClick={() => setTradeType("long")}
                >
                  L
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">תאריך עסקה</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right bg-input border-border hover:border-primary/50 transition-colors"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {format(tradeDate, "dd/MM/yyyy", { locale: he })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={tradeDate}
                    onSelect={(date) => date && setTradeDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
                    className="bg-input border-border text-center w-14 hover:border-primary/50 transition-colors"
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
                    className="bg-input border-border text-center w-14 hover:border-primary/50 transition-colors"
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
                    className="bg-input border-border text-center w-14 hover:border-primary/50 transition-colors"
                  />
                  <span className="text-[10px] text-muted-foreground">שניות</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Entry/Exit Prices, PnL, Points */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 stagger-children">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">מחיר כניסה</Label>
              <Input
                type="number"
                step="any"
                placeholder="100.25"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                className="bg-input border-border hover:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">מחיר יציאה</Label>
              <Input
                type="number"
                step="any"
                placeholder="101.00"
                value={formData.exitPrice}
                onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                className="bg-input border-border hover:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">נקודות</Label>
              <Input
                type="number"
                step="any"
                placeholder="5.50"
                value={formData.pnlPoints}
                onChange={(e) => setFormData({ ...formData, pnlPoints: e.target.value })}
                className="bg-input border-border hover:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label className="text-muted-foreground text-sm">רווח/הפסד ($)</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={pnlSign === "negative" && !isBreakeven ? "destructive" : "outline"}
                  size="icon"
                  className="h-10 w-10 rounded-full flex-shrink-0 hover:scale-110 transition-transform"
                  onClick={() => {
                    setPnlSign("negative");
                    setIsBreakeven(false);
                  }}
                  disabled={isBreakeven}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  step="any"
                  placeholder={isBreakeven ? "0" : "500.00"}
                  value={isBreakeven ? "0" : formData.pnl}
                  onChange={(e) => setFormData({ ...formData, pnl: e.target.value })}
                  disabled={isBreakeven}
                  className={cn(
                    "font-bold text-center text-lg transition-colors",
                    isBreakeven
                      ? "bg-warning/20 border-warning/30 text-warning"
                      : pnlSign === "positive"
                        ? "bg-success/20 border-success/30 text-success hover:border-success/50"
                        : "bg-destructive/20 border-destructive/30 text-destructive hover:border-destructive/50",
                  )}
                />
                <Button
                  type="button"
                  variant={pnlSign === "positive" && !isBreakeven ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full flex-shrink-0 hover:scale-110 transition-transform",
                    pnlSign === "positive" && !isBreakeven && "bg-primary",
                  )}
                  onClick={() => {
                    setPnlSign("positive");
                    setIsBreakeven(false);
                  }}
                  disabled={isBreakeven}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={isBreakeven ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-shrink-0 transition-all font-medium",
                    isBreakeven && "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30",
                  )}
                  onClick={() => {
                    setIsBreakeven(!isBreakeven);
                    if (!isBreakeven) {
                      setFormData({ ...formData, pnl: "0" });
                    }
                  }}
                >
                  BE
                </Button>
              </div>
            </div>
          </div>

          {/* Row 3: Risk, Commission, Rating, Strategy */}
          <div className="grid grid-cols-5 gap-4 stagger-children">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סיכון</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  step="any"
                  placeholder={riskType === "dollars" ? "200.00" : "2"}
                  value={formData.risk}
                  onChange={(e) => setFormData({ ...formData, risk: e.target.value })}
                  className="bg-input border-border hover:border-primary/50 transition-colors flex-1"
                />
                <div className="flex border border-border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setRiskType("dollars")}
                    className={cn(
                      "px-2 py-1 text-sm transition-colors",
                      riskType === "dollars" ? "bg-primary text-primary-foreground" : "bg-input hover:bg-secondary",
                    )}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskType("percent")}
                    className={cn(
                      "px-2 py-1 text-sm transition-colors",
                      riskType === "percent" ? "bg-primary text-primary-foreground" : "bg-input hover:bg-secondary",
                    )}
                  >
                    %
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">RR (Risk to Reward)</Label>
              <Input
                type="number"
                step="any"
                placeholder="2.5"
                value={formData.rr}
                onChange={(e) => setFormData({ ...formData, rr: e.target.value })}
                className="bg-input border-border hover:border-primary/50 transition-colors"
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
                <Select value={selectedStrategy?.id || ""} onValueChange={handleStrategyChange}>
                  <SelectTrigger className="bg-input border-border flex-1">
                    <SelectValue placeholder="בחר אסטרטגיה" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
                    <div className="space-y-2">
                      {portfolios.map((portfolio) => (
                        <div key={portfolio.id} className="flex items-center gap-2 justify-end">
                          <Label htmlFor={`sync-${portfolio.id}`} className="text-sm cursor-pointer order-1">
                            {portfolio.name}
                          </Label>
                          <Checkbox
                            id={`sync-${portfolio.id}`}
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

          {/* Confirmations */}
          {selectedStrategy && selectedStrategy.confirmations.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-muted-foreground text-sm">אישורים - {selectedStrategy.name}</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg">
                {selectedStrategy.confirmations.map((conf) => (
                  <div key={conf.id} className="flex items-center gap-2">
                    <Checkbox
                      id={conf.id}
                      checked={selectedConfirmations.includes(conf.name)}
                      onCheckedChange={() => toggleConfirmation(conf.name)}
                    />
                    <label htmlFor={conf.id} className="text-sm cursor-pointer">
                      {conf.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                נבחרו {selectedConfirmations.length} מתוך {selectedStrategy.confirmations.length} אישורים
              </p>
            </div>
          )}

          {/* Screenshot Upload */}
          <div className="space-y-3 animate-fade-in">
            <Label className="text-muted-foreground text-sm">צילומי מסך של העסקה</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Timeframe selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">בחר טיימפריים לתמונה הבאה:</span>
              <div className="flex gap-1 flex-wrap">
                {["1m", "5m", "15m", "30m", "1h", "4h", "1d"].map((tf) => (
                  <Button
                    key={tf}
                    type="button"
                    variant={selectedTimeframe === tf ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTimeframe(tf)}
                    className={cn(
                      "h-7 px-2 text-xs transition-all",
                      selectedTimeframe === tf && "scale-105"
                    )}
                  >
                    {tf}
                  </Button>
                ))}
              </div>
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {screenshots.map((ss, index) => (
                  <div key={index} className="relative border border-border rounded-lg overflow-hidden aspect-video group">
                    <img src={ss.preview} alt={`צילום מסך ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 px-2 py-0.5 bg-primary/90 text-primary-foreground text-xs rounded font-medium">
                      {ss.timeframe}
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

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer group"
            >
              {uploadingImage ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : (
                <>
                  <Upload className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm">{screenshots.length > 0 ? "הוסף עוד תמונות" : "לחץ להעלאת צילומי מסך"}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {selectedTimeframe && `יועלה עם טיימפריים: ${selectedTimeframe}`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Notes - Split into Entry Reason and Conclusions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">סיבת כניסה לעסקה</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={improvingEntryReason || !formData.entryReason.trim()}
                  onClick={() => improveTextWithAI("entry_reason")}
                  className="h-7 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  {improvingEntryReason ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  שפר עם AI
                </Button>
              </div>
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
                  className="border-0 min-h-[120px] max-h-[200px] overflow-y-auto resize-none focus-visible:ring-0 text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-sm">מסקנות לאחר העסקה</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={improvingConclusions || !formData.conclusions.trim()}
                  onClick={() => improveTextWithAI("conclusions")}
                  className="h-7 gap-1 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  {improvingConclusions ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  שפר עם AI
                </Button>
              </div>
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
                  className="border-0 min-h-[120px] max-h-[200px] overflow-y-auto resize-none focus-visible:ring-0 text-right"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 justify-start pt-4 animate-slide-up">
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 hover:scale-105 transition-transform"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                "הוסף עסקה"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              className="hover:scale-105 transition-transform"
              disabled={loading}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
