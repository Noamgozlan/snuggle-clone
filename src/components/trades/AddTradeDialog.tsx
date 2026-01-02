import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Minus, Star, Upload, Loader2, X, CalendarIcon } from "lucide-react";
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
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [selectedConfirmations, setSelectedConfirmations] = useState<string[]>([]);
  const [riskType, setRiskType] = useState<"dollars" | "percent">("dollars");
  const [isBreakeven, setIsBreakeven] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tradeDate, setTradeDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "1",
    durationHours: "",
    durationMinutes: "",
    durationSeconds: "",
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
    setScreenshotUrl(null);
    setScreenshotPreview(null);
    setSelectedStrategy(null);
    setSelectedConfirmations([]);
    setRiskType("dollars");
    setIsBreakeven(false);
  };

  const handleStrategyChange = (strategyId: string) => {
    const strategy = strategies.find(s => s.id === strategyId) || null;
    setSelectedStrategy(strategy);
    setSelectedConfirmations([]);
  };

  const toggleConfirmation = (confName: string) => {
    setSelectedConfirmations(prev =>
      prev.includes(confName)
        ? prev.filter(c => c !== confName)
        : [...prev, confName]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('trade-screenshots')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('trade-screenshots')
        .getPublicUrl(fileName);

      setScreenshotUrl(publicUrl);
      toast({
        title: "התמונה הועלתה בהצלחה",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "שגיאה בהעלאת התמונה",
        variant: "destructive",
      });
      setScreenshotPreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeScreenshot = () => {
    setScreenshotUrl(null);
    setScreenshotPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      // Build entry date from selected date
      const tradeDateStr = format(tradeDate, 'yyyy-MM-dd');
      const entryDate = `${tradeDateStr}T00:00:00`;

      // Calculate exit date based on duration
      let exitDate = null;
      if (formData.durationHours || formData.durationMinutes || formData.durationSeconds) {
        const hours = parseInt(formData.durationHours) || 0;
        const minutes = parseInt(formData.durationMinutes) || 0;
        const seconds = parseInt(formData.durationSeconds) || 0;
        
        const entryDateTime = new Date(`${tradeDateStr}T00:00:00`);
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

      const { data: tradeData, error } = await supabase.from('trades').insert({
        user_id: user.id,
        portfolio_id: activePortfolio?.id || null,
        symbol: formData.symbol.toUpperCase(),
        trade_type: tradeType,
        quantity: parseFloat(formData.quantity) || 1,
        entry_date: entryDate,
        exit_date: exitDate,
        entry_price: 0,
        exit_price: null,
        pnl: pnlValue,
        pnl_points: formData.pnlPoints ? parseFloat(formData.pnlPoints) : null,
        risk: formData.risk ? parseFloat(formData.risk) : null,
        rr: formData.rr ? parseFloat(formData.rr) : null,
        rating: rating || null,
        strategy: selectedStrategy?.name || null,
        entry_reason: formData.entryReason || null,
        conclusions: formData.conclusions || null,
        is_closed: true,
        screenshot_url: screenshotUrl,
      }).select('id').single();

      if (error) throw error;

      // Save selected confirmations for this trade
      if (tradeData && selectedConfirmations.length > 0) {
        const confirmationsToInsert = selectedConfirmations.map(confName => ({
          trade_id: tradeData.id,
          confirmation_name: confName,
        }));

        const { error: confError } = await supabase
          .from('trade_confirmations')
          .insert(confirmationsToInsert);

        if (confError) {
          console.error('Error saving confirmations:', confError);
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
      console.error('Error adding trade:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border animate-scale-in">
        <DialogHeader className="animate-fade-in">
          <DialogTitle className="text-xl font-bold text-right">הוסף עסקה חדשה</DialogTitle>
          <p className="text-sm text-muted-foreground text-right">הזן את פרטי העסקה להלן</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Row 1: Symbol, Quantity, Direction, Entry/Exit Times */}
          <div className="grid grid-cols-6 gap-4 stagger-children">
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
              <Label className="text-muted-foreground text-sm">כיוון</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant={tradeType === "short" ? "destructive" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1 transition-all duration-200",
                    tradeType === "short" && "scale-105"
                  )}
                  onClick={() => setTradeType("short")}
                >
                  S
                </Button>
                <Button
                  type="button"
                  variant={tradeType === "long" ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1 transition-all duration-200",
                    tradeType === "long" && "scale-105 bg-primary"
                  )}
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

          {/* Row 2: PnL, Points */}
          <div className="grid grid-cols-3 gap-4 stagger-children">
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
                        : "bg-destructive/20 border-destructive/30 text-destructive hover:border-destructive/50"
                  )}
                />
                <Button
                  type="button"
                  variant={pnlSign === "positive" && !isBreakeven ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full flex-shrink-0 hover:scale-110 transition-transform",
                    pnlSign === "positive" && !isBreakeven && "bg-primary"
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
                    isBreakeven && "bg-warning/20 text-warning border-warning/30 hover:bg-warning/30"
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
          <div className="grid grid-cols-4 gap-4 stagger-children">
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
                      riskType === "dollars" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-input hover:bg-secondary"
                    )}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setRiskType("percent")}
                    className={cn(
                      "px-2 py-1 text-sm transition-colors",
                      riskType === "percent" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-input hover:bg-secondary"
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
                        star <= rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">אסטרטגיה</Label>
              <Select
                value={selectedStrategy?.id || ""}
                onValueChange={handleStrategyChange}
              >
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="בחר אסטרטגיה" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                    <label
                      htmlFor={conf.id}
                      className="text-sm cursor-pointer"
                    >
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
          <div className="space-y-2 animate-fade-in">
            <Label className="text-muted-foreground text-sm">צילום מסך של העסקה</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {screenshotPreview ? (
              <div className="relative border border-border rounded-xl overflow-hidden">
                <img 
                  src={screenshotPreview} 
                  alt="צילום מסך" 
                  className="w-full max-h-64 object-contain bg-secondary/30"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:scale-110 transition-transform"
                >
                  <X className="h-4 w-4" />
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer group"
              >
                <Upload className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                <p>לחץ להעלאת צילום מסך</p>
              </div>
            )}
          </div>

          {/* Entry Reason & Conclusions */}
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">סיבת כניסה לעסקה</Label>
              <Textarea
                placeholder="למה נכנסת לעסקה? מה היו הסיגנלים?"
                value={formData.entryReason}
                onChange={(e) => setFormData({ ...formData, entryReason: e.target.value })}
                className="bg-input border-border min-h-[120px] max-h-[200px] overflow-y-auto resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">מסקנות לאחר העסקה</Label>
              <Textarea
                placeholder="מה למדת מהעסקה? מה היית עושה אחרת?"
                value={formData.conclusions}
                onChange={(e) => setFormData({ ...formData, conclusions: e.target.value })}
                className="bg-input border-border min-h-[120px] max-h-[200px] overflow-y-auto resize-none"
              />
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
