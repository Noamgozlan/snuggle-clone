import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Loader2, Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePropAccounts, type PropAccount } from "@/hooks/usePropAccounts";
import { PropSummaryCards } from "@/components/prop/PropSummaryCards";
import { PropAccountCard } from "@/components/prop/PropAccountCard";
import { PropAccountDialog } from "@/components/prop/PropAccountDialog";
import { RecordPayoutDialog } from "@/components/prop/RecordPayoutDialog";
import { toast } from "sonner";

const PropPortfolios = () => {
  const { language, isRTL } = useLanguage();
  const isHe = language === "he";
  const {
    accounts,
    loading,
    statsByAccount,
    summary,
    createAccount,
    updateAccount,
    deleteAccount,
    recordPayout,
  } = usePropAccounts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PropAccount | null>(null);
  const [payoutTarget, setPayoutTarget] = useState<PropAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropAccount | null>(null);
  const [tab, setTab] = useState<"active" | "archive">("active");

  const visible = accounts.filter((a) =>
    tab === "active" ? a.status !== "archived" && a.status !== "failed" : a.status === "archived" || a.status === "failed"
  );

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (a: PropAccount) => {
    setEditing(a);
    setDialogOpen(true);
  };

  const handleSubmit = async (input: any) => {
    if (editing) return updateAccount(editing.id, input);
    return createAccount(input);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await deleteAccount(deleteTarget.id);
    if (error) toast.error(isHe ? "שגיאה במחיקה" : "Delete failed");
    else toast.success(isHe ? "נמחק" : "Deleted");
    setDeleteTarget(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {isHe ? "ניהול תיקים" : "Portfolio Management"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isHe
                ? "מעקב חכם אחרי תיקי פרופ-פרמס שלך, סנכרון אוטומטי עם יומן המסחר"
                : "Track your prop firm accounts with automatic sync from your trading journal"}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {isHe ? "הוסף תיק חדש" : "Add New Account"}
          </Button>
        </div>

        {/* Summary cards */}
        <PropSummaryCards
          activeCount={summary.activeCount}
          totalCount={summary.totalCount}
          totalCost={summary.totalCost}
          totalPayouts={summary.totalPayouts}
          netProfit={summary.netProfit}
        />

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "active" | "archive")} className="w-full">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="active">{isHe ? "פעילים" : "Active"}</TabsTrigger>
            <TabsTrigger value="archive">{isHe ? "ארכיון / נכשלו" : "Archive / Failed"}</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : visible.length === 0 ? (
              <Card className="p-12 bg-card border-border border-dashed text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {tab === "active"
                    ? isHe ? "אין תיקים פעילים" : "No active accounts"
                    : isHe ? "אין תיקים בארכיון" : "Archive is empty"}
                </h3>
                {tab === "active" && (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      {isHe ? "הוסף את התיק הראשון שלך כדי להתחיל לעקוב" : "Add your first account to start tracking"}
                    </p>
                    <Button onClick={openCreate} className="gap-2">
                      <Plus className="h-4 w-4" />
                      {isHe ? "הוסף תיק חדש" : "Add New Account"}
                    </Button>
                  </>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {visible.map((acc) => (
                  <PropAccountCard
                    key={acc.id}
                    account={acc}
                    stats={statsByAccount[acc.id]}
                    onRecordPayout={() => setPayoutTarget(acc)}
                    onEdit={() => openEdit(acc)}
                    onDelete={() => setDeleteTarget(acc)}
                    onChangeStatus={async (status) => {
                      const { error } = await updateAccount(acc.id, { status });
                      if (error) toast.error(isHe ? "שגיאה בעדכון" : "Update failed");
                      else toast.success(isHe ? "הסטטוס עודכן" : "Status updated");
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <PropAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <RecordPayoutDialog
        open={!!payoutTarget}
        onOpenChange={(o) => !o && setPayoutTarget(null)}
        accountLabel={payoutTarget ? `${payoutTarget.firm_name} — $${payoutTarget.account_size.toLocaleString()}` : ""}
        onSubmit={(amount, date, notes) =>
          recordPayout(payoutTarget!.id, amount, date, notes)
        }
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isHe ? "למחוק את התיק?" : "Delete account?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isHe
                ? "פעולה זו לא ניתנת לביטול. כל המשיכות שנרשמו לתיק זה יימחקו גם הן."
                : "This cannot be undone. All payouts recorded for this account will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isHe ? "ביטול" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              {isHe ? "מחק" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default PropPortfolios;
