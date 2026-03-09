import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Gift, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const Giveaways = () => {
  const { t } = useLanguage();

  return (
    <DashboardLayout title={t("giveaways.title")}>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 p-12 text-center max-w-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-warning to-primary" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-warning/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6 shadow-lg shadow-primary/25">
              <Gift className="h-10 w-10 text-primary-foreground" />
            </div>
            
            <div className="flex justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-warning animate-pulse" />
              <Sparkles className="h-4 w-4 text-primary animate-pulse delay-100" />
              <Sparkles className="h-5 w-5 text-warning animate-pulse delay-200" />
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent mb-3">
              {t("giveaways.comingSoon")}
            </h1>
            
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {t("giveaways.workingOn")}
              <br />
              {t("giveaways.exclusive")}
            </p>
            
            <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
              <Bell className="h-4 w-4" />
              {t("giveaways.notify")}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Giveaways;
