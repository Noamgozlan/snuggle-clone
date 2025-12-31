import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BacktestingWorkspace } from "@/components/backtesting/BacktestingWorkspace";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Clock, Lock, Sparkles } from "lucide-react";

const ComingSoonView = () => {
  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center p-4" dir="rtl">
      <Card className="max-w-lg w-full p-8 text-center space-y-6 bg-card/50 backdrop-blur-sm border-primary/20">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-10 w-10 text-primary animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">מגיע בקרוב</h1>
          <p className="text-muted-foreground text-lg">
            מערכת הבקטסטינג המתקדמת שלנו בפיתוח אחרון
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">גרפים מתקדמים בסגנון TradingView</h3>
              <p className="text-sm text-muted-foreground">אינדיקטורים, כלי ציור וניתוח טכני</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">סימולציית עסקאות מלאה</h3>
              <p className="text-sm text-muted-foreground">תרגול אסטרטגיות על נתונים היסטוריים</p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground pt-4 border-t border-border">
          הפיצ'ר יהיה זמין בקרוב לכל המשתמשים 🚀
        </p>
      </Card>
    </div>
  );
};

const LoadingView = () => {
  return (
    <div className="h-[calc(100vh-80px)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
};

const Backtesting = () => {
  const { loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <DashboardLayout>
        <LoadingView />
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <ComingSoonView />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <BacktestingWorkspace />
    </DashboardLayout>
  );
};

export default Backtesting;
