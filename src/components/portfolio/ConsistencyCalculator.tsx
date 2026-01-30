import { useState, useMemo } from "react";
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
import { Calculator, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ConsistencyCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [totalProfit, setTotalProfit] = useState("");
  const [highestDayProfit, setHighestDayProfit] = useState("");
  const [maxAllowedPercentage, setMaxAllowedPercentage] = useState("30");

  const calculation = useMemo(() => {
    const total = parseFloat(totalProfit) || 0;
    const highest = parseFloat(highestDayProfit) || 0;
    const maxPercentage = parseFloat(maxAllowedPercentage) || 30;

    if (total <= 0 || highest <= 0) {
      return null;
    }

    const consistencyPercentage = (highest / total) * 100;
    const isConsistent = consistencyPercentage <= maxPercentage;
    const requiredTotal = highest / (maxPercentage / 100);
    const additionalNeeded = requiredTotal - total;

    return {
      consistencyPercentage,
      isConsistent,
      requiredTotal,
      additionalNeeded: additionalNeeded > 0 ? additionalNeeded : 0,
    };
  }, [totalProfit, highestDayProfit, maxAllowedPercentage]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                aria-label="מחשבון עקביות"
              >
                <Calculator className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>מחשבון עקביות</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-md bg-card border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Calculator className="h-5 w-5 text-primary" />
            מחשבון עקביות (Consistency Rule)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Info box */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
            <p>
              חוק העקביות קובע שרווח היום הגבוה ביותר לא יעלה על אחוז מסוים מסך הרווח הכולל.
              זה מבטיח מסחר עקבי ולא "הימור" על עסקה אחת.
            </p>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>סך הרווח הכולל ($)</Label>
              <Input
                type="number"
                step="any"
                value={totalProfit}
                onChange={(e) => setTotalProfit(e.target.value)}
                placeholder="2000"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>רווח היום הגבוה ביותר ($)</Label>
              <Input
                type="number"
                step="any"
                value={highestDayProfit}
                onChange={(e) => setHighestDayProfit(e.target.value)}
                placeholder="500"
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label>אחוז מקסימלי מותר (%)</Label>
              <Input
                type="number"
                step="any"
                value={maxAllowedPercentage}
                onChange={(e) => setMaxAllowedPercentage(e.target.value)}
                placeholder="30"
                className="bg-input border-border"
              />
            </div>
          </div>

          {/* Results */}
          {calculation && (
            <div className="space-y-3 pt-2">
              <div className="h-px bg-border" />
              
              {/* Consistency Percentage */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">אחוז עקביות נוכחי:</span>
                <span className={cn(
                  "font-bold text-lg",
                  calculation.isConsistent ? "text-green-500" : "text-destructive"
                )}>
                  {calculation.consistencyPercentage.toFixed(1)}%
                </span>
              </div>

              {/* Status */}
              <div className={cn(
                "rounded-lg p-4 flex items-center gap-3",
                calculation.isConsistent 
                  ? "bg-green-500/10 border border-green-500/30" 
                  : "bg-destructive/10 border border-destructive/30"
              )}>
                {calculation.isConsistent ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-destructive shrink-0" />
                )}
                <div>
                  <p className={cn(
                    "font-semibold",
                    calculation.isConsistent ? "text-green-500" : "text-destructive"
                  )}>
                    {calculation.isConsistent ? "עומד בחוק העקביות! ✓" : "לא עומד בחוק העקביות"}
                  </p>
                  {!calculation.isConsistent && (
                    <p className="text-sm text-muted-foreground mt-1">
                      צריך עוד <span className="font-semibold text-foreground">${calculation.additionalNeeded.toFixed(2)}</span> רווח כדי לעמוד בכלל
                    </p>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              {!calculation.isConsistent && (
                <div className="bg-muted/30 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">סך רווח נדרש:</span>{" "}
                    ${calculation.requiredTotal.toFixed(2)}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    כדי שרווח של ${highestDayProfit} יהווה מקסימום {maxAllowedPercentage}% מסך הרווח
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Formula */}
          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground mt-4">
            <p className="font-medium text-foreground mb-1">נוסחה:</p>
            <p className="font-mono">
              (רווח יום גבוה ÷ סך רווח) × 100 = אחוז עקביות
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
