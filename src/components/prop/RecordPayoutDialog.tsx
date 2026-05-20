import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountLabel: string;
  onSubmit: (amount: number, date: string, notes?: string) => Promise<{ error: any }>;
}

export const RecordPayoutDialog = ({ open, onOpenChange, accountLabel, onSubmit }: Props) => {
  const { language } = useLanguage();
  const isHe = language === "he";
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
  }, [open]);

  const handleSave = async () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.error(isHe ? "סכום לא תקין" : "Invalid amount");
      return;
    }
    setSaving(true);
    const { error } = await onSubmit(num, date, notes.trim() || undefined);
    setSaving(false);
    if (error) {
      toast.error(isHe ? "שגיאה בשמירה" : "Save failed");
      return;
    }
    toast.success(isHe ? "המשיכה נרשמה" : "Payout recorded");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isHe ? "רישום משיכה" : "Record Payout"}</DialogTitle>
          <p className="text-sm text-muted-foreground">{accountLabel}</p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{isHe ? "סכום ($)" : "Amount ($)"}</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>{isHe ? "תאריך משיכה" : "Payout Date"}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{isHe ? "הערות (אופציונלי)" : "Notes (optional)"}</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {isHe ? "ביטול" : "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isHe ? "שמור" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
