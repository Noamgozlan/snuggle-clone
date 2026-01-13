import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, Wallet, Check, Loader2, Settings, Trash2, Star } from "lucide-react";
import { usePortfolio, Portfolio } from "@/contexts/PortfolioContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const PortfolioSelector = () => {
  const { portfolios, activePortfolio, setActivePortfolio, createPortfolio, updatePortfolio, deletePortfolio, setDefaultPortfolio } = usePortfolio();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    balance: "",
    drawdown: "",
    profit_goal: "",
  });

  const resetForm = () => {
    setFormData({ name: "", balance: "", drawdown: "", profit_goal: "" });
  };

  const openCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setFormData({
      name: portfolio.name,
      balance: String(portfolio.balance),
      drawdown: portfolio.drawdown ? String(portfolio.drawdown) : "",
      profit_goal: portfolio.profit_goal ? String(portfolio.profit_goal) : "",
    });
    setIsEditOpen(true);
  };

  const openDelete = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.balance) {
      toast({ title: "שגיאה", description: "יש למלא שם וסכום התחלתי", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = await createPortfolio({
      name: formData.name,
      balance: parseFloat(formData.balance),
      drawdown: formData.drawdown ? parseFloat(formData.drawdown) : undefined,
      profit_goal: formData.profit_goal ? parseFloat(formData.profit_goal) : undefined,
    });
    setSaving(false);

    if (result.success) {
      toast({ title: "התיק נוצר בהצלחה!" });
      setIsCreateOpen(false);
      resetForm();
    } else {
      toast({ title: "שגיאה", description: "לא ניתן ליצור את התיק", variant: "destructive" });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolio || !formData.name.trim() || !formData.balance) {
      toast({ title: "שגיאה", description: "יש למלא שם וסכום", variant: "destructive" });
      return;
    }

    setSaving(true);
    const result = await updatePortfolio(editingPortfolio.id, {
      name: formData.name,
      balance: parseFloat(formData.balance),
      drawdown: formData.drawdown ? parseFloat(formData.drawdown) : null,
      profit_goal: formData.profit_goal ? parseFloat(formData.profit_goal) : null,
    });
    setSaving(false);

    if (result.success) {
      toast({ title: "התיק עודכן!" });
      setIsEditOpen(false);
      setEditingPortfolio(null);
    } else {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן את התיק", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!editingPortfolio) return;

    const result = await deletePortfolio(editingPortfolio.id);
    if (result.success) {
      toast({ title: "התיק נמחק" });
      setIsDeleteOpen(false);
      setEditingPortfolio(null);
    } else {
      toast({ title: "שגיאה", description: "לא ניתן למחוק את התיק", variant: "destructive" });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[140px] justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="truncate max-w-[100px]">
                {activePortfolio?.name || "בחר תיק"}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
          {portfolios.length === 0 ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              אין תיקים עדיין
            </div>
          ) : (
            portfolios.map((portfolio) => (
              <DropdownMenuItem
                key={portfolio.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setActivePortfolio(portfolio)}
              >
                <div className="flex items-center gap-2">
                  {activePortfolio?.id === portfolio.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                  <span className={cn(
                    activePortfolio?.id !== portfolio.id && "mr-6"
                  )}>
                    {portfolio.name}
                  </span>
                  {portfolio.is_default && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-6 w-6", portfolio.is_default && "text-yellow-500")}
                    title="קבע כברירת מחדל"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const result = await setDefaultPortfolio(portfolio.id);
                      if (result.success) {
                        toast({ title: `"${portfolio.name}" נקבע כברירת מחדל` });
                      }
                    }}
                  >
                    <Star className={cn("h-3 w-3", portfolio.is_default && "fill-current")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(portfolio);
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDelete(portfolio);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openCreate} className="cursor-pointer">
            <Plus className="h-4 w-4 ml-2" />
            צור תיק חדש
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-right">צור תיק חדש</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>שם התיק *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="למשל: חשבון ראשי"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>סכום התחלתי ($) *</Label>
              <Input
                type="number"
                step="any"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                placeholder="10000"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Drawdown מקסימלי ($) - אופציונלי</Label>
              <Input
                type="number"
                step="any"
                value={formData.drawdown}
                onChange={(e) => setFormData({ ...formData, drawdown: e.target.value })}
                placeholder="2000"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>יעד רווח ($) - אופציונלי</Label>
              <Input
                type="number"
                step="any"
                value={formData.profit_goal}
                onChange={(e) => setFormData({ ...formData, profit_goal: e.target.value })}
                placeholder="5000"
                className="bg-input border-border"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "צור תיק"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-right">ערוך תיק</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>שם התיק *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>סכום ($) *</Label>
              <Input
                type="number"
                step="any"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Drawdown מקסימלי ($)</Label>
              <Input
                type="number"
                step="any"
                value={formData.drawdown}
                onChange={(e) => setFormData({ ...formData, drawdown: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>יעד רווח ($)</Label>
              <Input
                type="number"
                step="any"
                value={formData.profit_goal}
                onChange={(e) => setFormData({ ...formData, profit_goal: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={saving} className="bg-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "שמור"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחק תיק?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את התיק "{editingPortfolio?.name}" לצמיתות.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
