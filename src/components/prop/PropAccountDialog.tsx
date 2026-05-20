import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePortfolio } from "@/contexts/PortfolioContext";
import {
  PROP_FIRMS,
  COMMON_SIZES,
  ACCOUNT_TYPE_LABELS,
  getPreset,
  type AccountType,
} from "@/lib/propFirmRules";
import { toast } from "sonner";
import type { PropAccount } from "@/hooks/usePropAccounts";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PropAccount | null;
  onSubmit: (input: Omit<PropAccount, "id" | "user_id" | "created_at" | "updated_at">) => Promise<{ error: any }>;
}

export const PropAccountDialog = ({ open, onOpenChange, initial, onSubmit }: Props) => {
  const { language } = useLanguage();
  const isHe = language === "he";
  const { portfolios } = usePortfolio();

  const [firm, setFirm] = useState<string>("Topstep");
  const [accountType, setAccountType] = useState<AccountType>("eval_phase_1");
  const [accountSize, setAccountSize] = useState<number>(50000);
  const [cost, setCost] = useState<string>("0");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<PropAccount["status"]>("active");
  const [portfolioId, setPortfolioId] = useState<string>("none");
  const [profitTarget, setProfitTarget] = useState<string>("");
  const [minDays, setMinDays] = useState<string>("");
  const [maxDD, setMaxDD] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [autoFilled, setAutoFilled] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setFirm(initial.firm_name);
      setAccountType(initial.account_type);
      setAccountSize(initial.account_size);
      setCost(String(initial.cost ?? 0));
      setStartDate(initial.start_date);
      setStatus(initial.status);
      setPortfolioId(initial.portfolio_id ?? "none");
      setProfitTarget(initial.profit_target != null ? String(initial.profit_target) : "");
      setMinDays(initial.min_trading_days != null ? String(initial.min_trading_days) : "");
      setMaxDD(initial.max_drawdown != null ? String(initial.max_drawdown) : "");
      setNotes(initial.notes ?? "");
      setAutoFilled(false);
    } else {
      setFirm("Topstep");
      setAccountType("eval_phase_1");
      setAccountSize(50000);
      setCost("0");
      setStartDate(new Date().toISOString().slice(0, 10));
      setStatus("active");
      setPortfolioId("none");
      setNotes("");
      setAutoFilled(true);
    }
  }, [open, initial]);

  // Auto-fill rule fields from preset when firm/type/size change (only if user hasn't edited them manually)
  useEffect(() => {
    if (!autoFilled) return;
    const preset = getPreset(firm, accountType, accountSize);
    if (preset) {
      setProfitTarget(String(preset.profit_target));
      setMinDays(String(preset.min_trading_days));
      setMaxDD(String(preset.max_drawdown));
    } else {
      setProfitTarget("");
      setMinDays("");
      setMaxDD("");
    }
  }, [firm, accountType, accountSize, autoFilled]);

  const applyPresetAgain = () => {
    setAutoFilled(true);
    const preset = getPreset(firm, accountType, accountSize);
    if (preset) {
      setProfitTarget(String(preset.profit_target));
      setMinDays(String(preset.min_trading_days));
      setMaxDD(String(preset.max_drawdown));
      toast.success(isHe ? "החוקים מולאו מה-preset" : "Rules filled from preset");
    } else {
      toast.info(isHe ? "אין preset לשילוב זה" : "No preset for this combination");
    }
  };

  const handleSave = async () => {
    if (!firm.trim()) {
      toast.error(isHe ? "חובה לבחור חברה" : "Firm is required");
      return;
    }
    setSaving(true);
    const { error } = await onSubmit({
      firm_name: firm,
      account_type: accountType,
      account_size: accountSize,
      cost: parseFloat(cost) || 0,
      start_date: startDate,
      status,
      portfolio_id: portfolioId === "none" ? null : portfolioId,
      profit_target: profitTarget === "" ? null : parseFloat(profitTarget),
      min_trading_days: minDays === "" ? null : parseInt(minDays, 10),
      max_drawdown: maxDD === "" ? null : parseFloat(maxDD),
      rules_preset: getPreset(firm, accountType, accountSize) ? `${firm}-${accountType}-${accountSize}` : null,
      notes: notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(isHe ? "שגיאה בשמירה" : "Save failed");
      return;
    }
    toast.success(isHe ? "נשמר בהצלחה" : "Saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initial ? (isHe ? "עריכת תיק" : "Edit Account") : isHe ? "הוסף תיק חדש" : "Add New Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>{isHe ? "שם החברה" : "Firm"}</Label>
            <Select value={firm} onValueChange={(v) => { setFirm(v); setAutoFilled(true); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROP_FIRMS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "סוג התיק" : "Account Type"}</Label>
            <Select value={accountType} onValueChange={(v) => { setAccountType(v as AccountType); setAutoFilled(true); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {isHe ? ACCOUNT_TYPE_LABELS[t].he : ACCOUNT_TYPE_LABELS[t].en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "גודל התיק" : "Account Size"}</Label>
            <Select value={String(accountSize)} onValueChange={(v) => { setAccountSize(parseInt(v, 10)); setAutoFilled(true); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMMON_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>${s.toLocaleString()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "עלות התיק ($)" : "Cost ($)"}</Label>
            <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "תאריך פתיחה" : "Start Date"}</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "סטטוס" : "Status"}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PropAccount["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{isHe ? "פעיל" : "Active"}</SelectItem>
                <SelectItem value="passed">{isHe ? "עבר" : "Passed"}</SelectItem>
                <SelectItem value="failed">{isHe ? "נכשל" : "Failed"}</SelectItem>
                <SelectItem value="archived">{isHe ? "ארכיון" : "Archived"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{isHe ? "קשר לתיק ביומן (אופציונלי)" : "Link to Journal Portfolio (optional)"}</Label>
            <Select value={portfolioId} onValueChange={setPortfolioId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{isHe ? "ללא קישור (כל העסקאות שלי)" : "No link (all my trades)"}</SelectItem>
                {portfolios.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {isHe
                ? "אם תקשר לתיק ביומן, רק עסקאות שלו ייספרו. אחרת ייספרו כל העסקאות מתאריך הפתיחה."
                : "If linked, only that portfolio's trades count. Otherwise all trades from start date count."}
            </p>
          </div>

          <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-border">
            <p className="text-sm font-semibold">{isHe ? "חוקי המשיכה" : "Payout Rules"}</p>
            <Button type="button" variant="ghost" size="sm" onClick={applyPresetAgain}>
              {isHe ? "מלא מ-preset" : "Fill from preset"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "יעד רווח ($)" : "Profit Target ($)"}</Label>
            <Input type="number" step="0.01" value={profitTarget} onChange={(e) => { setProfitTarget(e.target.value); setAutoFilled(false); }} />
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "מינ' ימי מסחר" : "Min Trading Days"}</Label>
            <Input type="number" step="1" value={minDays} onChange={(e) => { setMinDays(e.target.value); setAutoFilled(false); }} />
          </div>

          <div className="space-y-2">
            <Label>{isHe ? "Drawdown מקסימלי ($)" : "Max Drawdown ($)"}</Label>
            <Input type="number" step="0.01" value={maxDD} onChange={(e) => { setMaxDD(e.target.value); setAutoFilled(false); }} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{isHe ? "הערות" : "Notes"}</Label>
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
