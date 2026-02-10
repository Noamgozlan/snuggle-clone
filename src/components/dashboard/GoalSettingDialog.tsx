import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface GoalSettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goalType: string, metric: string, targetValue: number) => Promise<{ success: boolean }>;
}

export const GoalSettingDialog = ({ open, onOpenChange, onSave }: GoalSettingDialogProps) => {
  const [goalType, setGoalType] = useState("daily");
  const [metric, setMetric] = useState("pnl");
  const [targetValue, setTargetValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const val = parseFloat(targetValue);
    if (isNaN(val) || val <= 0) return;
    setSaving(true);
    const result = await onSave(goalType, metric, val);
    setSaving(false);
    if (result.success) { onOpenChange(false); setTargetValue(""); }
  };

  const metricLabel = { pnl: "$", trades: "עסקאות", winrate: "%", points: "נקודות" }[metric] || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader><DialogTitle>הגדרת יעד חדש</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>סוג יעד</Label>
            <Select value={goalType} onValueChange={setGoalType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">יומי</SelectItem>
                <SelectItem value="weekly">שבועי</SelectItem>
                <SelectItem value="monthly">חודשי</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>מטריקה</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pnl">רווח/הפסד ($)</SelectItem>
                <SelectItem value="trades">מספר עסקאות</SelectItem>
                <SelectItem value="winrate">אחוז הצלחה (%)</SelectItem>
                <SelectItem value="points">נקודות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>ערך יעד ({metricLabel})</Label>
            <Input type="number" value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="0" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button onClick={handleSave} disabled={saving || !targetValue}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "צור יעד"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
