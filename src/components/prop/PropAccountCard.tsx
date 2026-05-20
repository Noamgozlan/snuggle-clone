import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle2, Pencil, Trash2, Archive, XCircle, DollarSign, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { ACCOUNT_TYPE_LABELS } from "@/lib/propFirmRules";
import type { PropAccount, PropAccountStats } from "@/hooks/usePropAccounts";

interface Props {
  account: PropAccount;
  stats: PropAccountStats;
  onRecordPayout: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: PropAccount["status"]) => void;
}

const statusBadge = (status: PropAccount["status"], isHe: boolean) => {
  switch (status) {
    case "active":
      return { label: isHe ? "פעיל" : "Active", cls: "bg-primary/15 text-primary border-primary/20" };
    case "passed":
      return { label: isHe ? "עבר" : "Passed", cls: "bg-success/15 text-success border-success/20" };
    case "failed":
      return { label: isHe ? "נכשל" : "Failed", cls: "bg-destructive/15 text-destructive border-destructive/20" };
    case "archived":
      return { label: isHe ? "ארכיון" : "Archived", cls: "bg-muted text-muted-foreground border-border" };
  }
};

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const PropAccountCard = ({ account, stats, onRecordPayout, onEdit, onDelete, onChangeStatus }: Props) => {
  const { language } = useLanguage();
  const isHe = language === "he";
  const sBadge = statusBadge(account.status, isHe);
  const typeLabel = isHe ? ACCOUNT_TYPE_LABELS[account.account_type].he : ACCOUNT_TYPE_LABELS[account.account_type].en;

  return (
    <Card className="p-4 md:p-5 bg-card border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-foreground truncate">{account.firm_name}</h3>
              <Badge variant="outline" className="text-[10px]">${account.account_size.toLocaleString()}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("border", sBadge.cls)}>{sBadge.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 me-2" />
                {isHe ? "ערוך" : "Edit"}
              </DropdownMenuItem>
              {account.status !== "passed" && (
                <DropdownMenuItem onClick={() => onChangeStatus("passed")}>
                  <CheckCircle2 className="h-4 w-4 me-2" />
                  {isHe ? "סמן כעבר" : "Mark as Passed"}
                </DropdownMenuItem>
              )}
              {account.status !== "failed" && (
                <DropdownMenuItem onClick={() => onChangeStatus("failed")}>
                  <XCircle className="h-4 w-4 me-2" />
                  {isHe ? "סמן כנכשל" : "Mark as Failed"}
                </DropdownMenuItem>
              )}
              {account.status !== "archived" && (
                <DropdownMenuItem onClick={() => onChangeStatus("archived")}>
                  <Archive className="h-4 w-4 me-2" />
                  {isHe ? "ארכיון" : "Archive"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 me-2" />
                {isHe ? "מחק" : "Delete"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {stats.eligibleForPayout && (
        <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-md bg-success/10 border border-success/30">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm font-semibold text-success">
            {isHe ? "זכאי למשיכה" : "Eligible for Payout"}
          </span>
        </div>
      )}

      {/* Progress to target */}
      {account.profit_target != null && (
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{isHe ? "התקדמות ליעד" : "Progress to Target"}</span>
            <span className={cn("font-semibold tabular-nums", stats.netPnl >= 0 ? "text-success" : "text-destructive")}>
              {fmt(stats.netPnl)} / {fmt(account.profit_target)}
            </span>
          </div>
          <Progress value={Math.max(0, Math.min(100, stats.progressPct))} className="h-1.5" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">{isHe ? "ימי מסחר" : "Trading Days"}</p>
          <p className="font-semibold text-foreground tabular-nums" dir="ltr">{stats.daysRatio}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{isHe ? "Drawdown" : "Drawdown"}</p>
          <p className={cn(
            "font-semibold tabular-nums",
            account.max_drawdown != null && stats.currentDrawdown > account.max_drawdown
              ? "text-destructive"
              : "text-foreground"
          )} dir="ltr">
            {fmt(stats.currentDrawdown)}
            {account.max_drawdown != null && <span className="text-muted-foreground"> / {fmt(account.max_drawdown)}</span>}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{isHe ? "משיכות" : "Payouts"}</p>
          <p className="font-semibold text-success tabular-nums" dir="ltr">
            {fmt(stats.payoutsTotal)}
            {stats.payoutCount > 0 && <span className="text-muted-foreground"> ({stats.payoutCount})</span>}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-border">
        <div className="text-[11px] text-muted-foreground">
          {isHe ? "עלות" : "Cost"}: <span className="text-foreground font-medium">{fmt(account.cost)}</span>
        </div>
        <Button size="sm" variant="outline" onClick={onRecordPayout}>
          <DollarSign className="h-3.5 w-3.5 me-1" />
          {isHe ? "עדכן משיכה" : "Record Payout"}
        </Button>
      </div>
    </Card>
  );
};
