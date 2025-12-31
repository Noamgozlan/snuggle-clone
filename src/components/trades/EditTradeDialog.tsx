import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Star, Upload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Trade } from "@/hooks/useTrades";

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
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    symbol: "",
    quantity: "1",
    tradeDate: "",
    entryPrice: "",
    exitPrice: "",
    pnl: "",
    pnlPoints: "",
    risk: "",
    rr: "",
    strategy: "",
    notes: "",
  });

  // Load trade data when trade changes
  useEffect(() => {
    if (trade) {
      const pnl = trade.pnl || 0;
      setFormData({
        symbol: trade.symbol || "",
        quantity: String(trade.quantity || 1),
        tradeDate: trade.entry_date ? trade.entry_date.split('T')[0] : "",
        entryPrice: String(trade.entry_price || ""),
        exitPrice: trade.exit_price ? String(trade.exit_price) : "",
        pnl: String(Math.abs(pnl)),
        pnlPoints: trade.pnl_points ? String(trade.pnl_points) : "",
        risk: trade.risk ? String(trade.risk) : "",
        rr: trade.rr ? String(trade.rr) : "",
        strategy: trade.strategy || "",
        notes: trade.notes || "",
      });
      setRating(trade.rating || 0);
      setTradeType(trade.trade_type as "long" | "short" || "long");
      setPnlSign(pnl >= 0 ? "positive" : "negative");
      setScreenshotUrl(trade.screenshot_url);
      setScreenshotPreview(trade.screenshot_url);
    }
  }, [trade]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
      toast({ title: "התמונה הועלתה בהצלחה" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "שגיאה בהעלאת התמונה", variant: "destructive" });
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
      if (formData.tradeDate) {
        entryDate = `${formData.tradeDate}T00:00:00`;
      }

      const pnlValue = formData.pnl 
        ? (pnlSign === "negative" ? -Math.abs(parseFloat(formData.pnl)) : Math.abs(parseFloat(formData.pnl)))
        : null;

      const { error } = await supabase
        .from('trades')
        .update({
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
          notes: formData.notes || null,
          is_closed: true,
          screenshot_url: screenshotUrl,
        })
        .eq('id', trade.id);

      if (error) throw error;

      toast({ title: "העסקה עודכנה בהצלחה!", description: `${formData.symbol} - ${tradeType.toUpperCase()}` });
      onOpenChange(false);
      onTradeUpdated?.();
    } catch (error) {
      console.error('Error updating trade:', error);
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את העסקה", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right">ערוך עסקה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Row 1 */}
          <div className="grid grid-cols-4 gap-4">
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
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-5 gap-4">
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
                      : "bg-destructive/20 border-destructive/30 text-destructive"
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
          <div className="grid grid-cols-4 gap-4">
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
                        star <= rating ? "fill-warning text-warning" : "text-muted-foreground"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">אסטרטגיה</Label>
              <Input
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                className="bg-input border-border"
              />
            </div>
          </div>

          {/* Notes & Screenshot */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">הערות</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-input border-border min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">צילום מסך</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 min-h-[120px] flex flex-col items-center justify-center relative">
                {screenshotPreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="w-full h-auto max-h-[200px] object-contain rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={removeScreenshot}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center">
                    {uploadingImage ? (
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">לחץ להעלאת תמונה</span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
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
