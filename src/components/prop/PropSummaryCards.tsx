import { Card } from "@/components/ui/card";
import { Briefcase, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface Props {
  activeCount: number;
  totalCount: number;
  totalCost: number;
  totalPayouts: number;
  netProfit: number;
}

const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export const PropSummaryCards = ({ activeCount, totalCount, totalCost, totalPayouts, netProfit }: Props) => {
  const { language } = useLanguage();
  const isHe = language === "he";

  const items = [
    {
      label: isHe ? "תיקים פעילים" : "Active Accounts",
      value: `${activeCount}`,
      sub: isHe ? `מתוך ${totalCount} סה"כ` : `of ${totalCount} total`,
      icon: Briefcase,
      tone: "text-foreground",
    },
    {
      label: isHe ? 'סה"כ הוצאות' : "Total Costs",
      value: fmt(totalCost),
      sub: isHe ? "עלות רכישת תיקים" : "Account purchase costs",
      icon: TrendingDown,
      tone: "text-destructive",
    },
    {
      label: isHe ? "סה\"כ משיכות" : "Total Payouts",
      value: fmt(totalPayouts),
      sub: isHe ? "הכנסות שהתקבלו" : "Received income",
      icon: DollarSign,
      tone: "text-success",
    },
    {
      label: isHe ? "רווח נקי כולל" : "Net Profit",
      value: fmt(netProfit),
      sub: isHe ? "משיכות פחות עלויות" : "Payouts minus costs",
      icon: TrendingUp,
      tone: netProfit >= 0 ? "text-success" : "text-destructive",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {items.map((it) => (
        <Card key={it.label} className={cn("p-4 md:p-5 bg-card border-border", it.highlight && "ring-1 ring-primary/20")}>
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{it.label}</p>
            <it.icon className={cn("h-4 w-4 md:h-5 md:w-5", it.tone)} />
          </div>
          <p className={cn("text-2xl md:text-3xl font-bold tracking-tight", it.tone)}>{it.value}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{it.sub}</p>
        </Card>
      ))}
    </div>
  );
};
