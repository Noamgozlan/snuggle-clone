import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useStrategies, Strategy } from "@/hooks/useStrategies";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Trash2, Edit, X, Loader2, CheckCircle2, ShieldCheck, LogIn, LogOut, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTrades } from "@/hooks/useTrades";

const Strategies = () => {
  const { strategies, loading, createStrategy, updateStrategy, deleteStrategy } = useStrategies();
  const { trades } = useTrades();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    entry_rules: "",
    exit_rules: "",
    risk_per_trade: "",
  });
  const [confirmations, setConfirmations] = useState<string[]>([]);
  const [newConfirmation, setNewConfirmation] = useState("");

  const resetForm = () => {
    setFormData({ name: "", description: "", entry_rules: "", exit_rules: "", risk_per_trade: "" });
    setConfirmations([]);
    setNewConfirmation("");
    setEditingStrategy(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (strategy: Strategy) => {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description || "",
      entry_rules: strategy.entry_rules || "",
      exit_rules: strategy.exit_rules || "",
      risk_per_trade: strategy.risk_per_trade || "",
    });
    setConfirmations(strategy.confirmations.map(c => c.name));
    setIsDialogOpen(true);
  };

  const addConfirmation = () => {
    if (newConfirmation.trim() && !confirmations.includes(newConfirmation.trim())) {
      setConfirmations([...confirmations, newConfirmation.trim()]);
      setNewConfirmation("");
    }
  };

  const removeConfirmation = (index: number) => {
    setConfirmations(confirmations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "שגיאה", description: "יש למלא שם אסטרטגיה", variant: "destructive" });
      return;
    }

    setSaving(true);

    const extra = { entry_rules: formData.entry_rules, exit_rules: formData.exit_rules, risk_per_trade: formData.risk_per_trade };
    const result = editingStrategy
      ? await updateStrategy(editingStrategy.id, formData.name, formData.description, confirmations, extra)
      : await createStrategy(formData.name, formData.description, confirmations, extra);

    setSaving(false);

    if (result.success) {
      toast({ title: editingStrategy ? "האסטרטגיה עודכנה!" : "האסטרטגיה נוצרה!" });
      setIsDialogOpen(false);
      resetForm();
    } else {
      toast({ title: "שגיאה", description: "לא ניתן לשמור את האסטרטגיה", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteStrategy(id);
    if (result.success) {
      toast({ title: "האסטרטגיה נמחקה" });
    } else {
      toast({ title: "שגיאה", description: "לא ניתן למחוק את האסטרטגיה", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout title="אסטרטגיות">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            אסטרטגיה חדשה
          </Button>
          <span className="text-sm text-muted-foreground">{strategies.length} אסטרטגיות</span>
        </div>

        {/* Strategies Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : strategies.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border">
            <p className="text-muted-foreground mb-4">אין אסטרטגיות עדיין</p>
            <Button onClick={openCreateDialog} className="bg-primary">
              <Plus className="h-4 w-4 ml-2" />
              צור אסטרטגיה ראשונה
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="p-5 bg-card border-border hover-lift">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-foreground">{strategy.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(strategy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>מחק אסטרטגיה?</AlertDialogTitle>
                          <AlertDialogDescription>פעולה זו תמחק את האסטרטגיה לצמיתות.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ביטול</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(strategy.id)}>מחק</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {strategy.description && <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>}

                {/* Stats: trades count & win rate */}
                {(() => {
                  const stratTrades = trades.filter(t => t.strategy === strategy.name);
                  const wins = stratTrades.filter(t => (t.pnl || 0) > 0).length;
                  const wr = stratTrades.length > 0 ? ((wins / stratTrades.length) * 100).toFixed(0) : "—";
                  return stratTrades.length > 0 ? (
                    <div className="flex gap-3 mb-3 text-xs">
                      <span className="bg-muted/50 px-2 py-1 rounded">{stratTrades.length} עסקאות</span>
                      <span className={`px-2 py-1 rounded ${Number(wr) >= 50 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{wr}% הצלחה</span>
                    </div>
                  ) : null;
                })()}

                {strategy.entry_rules && (
                  <div className="mb-2"><span className="text-xs text-muted-foreground flex items-center gap-1"><LogIn className="h-3 w-3" /> כללי כניסה:</span><p className="text-xs mt-0.5">{strategy.entry_rules}</p></div>
                )}
                {strategy.exit_rules && (
                  <div className="mb-2"><span className="text-xs text-muted-foreground flex items-center gap-1"><LogOut className="h-3 w-3" /> כללי יציאה:</span><p className="text-xs mt-0.5">{strategy.exit_rules}</p></div>
                )}
                {strategy.risk_per_trade && (
                  <div className="mb-2"><span className="text-xs text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> סיכון:</span><p className="text-xs mt-0.5">{strategy.risk_per_trade}</p></div>
                )}
                {strategy.screenshot_url && (
                  <img src={strategy.screenshot_url} alt="Strategy screenshot" className="w-full h-32 object-cover rounded-lg border border-border mb-3 cursor-pointer hover:opacity-90" onClick={() => window.open(strategy.screenshot_url!, '_blank')} />
                )}

                {strategy.confirmations.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">אישורים:</p>
                    <div className="flex flex-wrap gap-2">
                      {strategy.confirmations.map((conf) => (
                        <Badge key={conf.id} variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {conf.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-right">
              {editingStrategy ? "ערוך אסטרטגיה" : "אסטרטגיה חדשה"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>שם האסטרטגיה *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="למשל: Breakout Strategy"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>תיאור</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="תאר את האסטרטגיה..."
                className="bg-input border-border min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><LogIn className="h-3 w-3" /> כללי כניסה</Label>
                <Textarea value={formData.entry_rules} onChange={e => setFormData({ ...formData, entry_rules: e.target.value })} placeholder="מתי נכנסים?" className="bg-input border-border min-h-[60px]" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><LogOut className="h-3 w-3" /> כללי יציאה</Label>
                <Textarea value={formData.exit_rules} onChange={e => setFormData({ ...formData, exit_rules: e.target.value })} placeholder="מתי יוצאים?" className="bg-input border-border min-h-[60px]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> סיכון לעסקה</Label>
              <Input value={formData.risk_per_trade} onChange={e => setFormData({ ...formData, risk_per_trade: e.target.value })} placeholder="למשל: 1% מהחשבון" className="bg-input border-border" />
            </div>

            <div className="space-y-3">
              <Label>אישורים (Confirmations)</Label>
              <div className="flex gap-2">
                <Input
                  value={newConfirmation}
                  onChange={(e) => setNewConfirmation(e.target.value)}
                  placeholder="הוסף אישור..."
                  className="bg-input border-border"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addConfirmation())}
                />
                <Button type="button" onClick={addConfirmation} variant="secondary">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {confirmations.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-secondary/30 rounded-lg">
                  {confirmations.map((conf, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {conf}
                      <button
                        type="button"
                        onClick={() => removeConfirmation(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingStrategy ? "שמור" : "צור אסטרטגיה")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Strategies;
