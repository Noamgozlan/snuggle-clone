import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Target, Zap, Shield } from "lucide-react";

const IndicatorPage = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "זיהוי מגמות מדויק",
      description: "אלגוריתם מתקדם לזיהוי מגמות בזמן אמת"
    },
    {
      icon: Target,
      title: "נקודות כניסה ויציאה",
      description: "סיגנלים ברורים לפתיחה וסגירה של עסקאות"
    },
    {
      icon: Zap,
      title: "התראות בזמן אמת",
      description: "קבל התראות ישירות ל-TradingView"
    },
    {
      icon: Shield,
      title: "ניהול סיכונים",
      description: "כלים מובנים לניהול סיכונים חכם"
    }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-8" dir="rtl">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8 bg-card/50 backdrop-blur-sm border-primary/20">
        {/* Header */}
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Gozlan Forever Model
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            האינדיקטור המתקדם ביותר לזיהוי הזדמנויות מסחר ב-TradingView
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-4 space-y-4">
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8 py-6 text-lg font-semibold"
            onClick={() => window.open("https://whop.com/gozlan", "_blank")}
          >
            <ExternalLink className="ml-2 h-5 w-5" />
            לרכישת האינדיקטור
          </Button>
          
          <p className="text-sm text-muted-foreground">
            גישה מיידית לאחר הרכישה • תמיכה מלאה • עדכונים שוטפים
          </p>
        </div>
      </Card>
    </div>
  );
};

const Backtesting = () => {
  return (
    <DashboardLayout>
      <IndicatorPage />
    </DashboardLayout>
  );
};

export default Backtesting;
