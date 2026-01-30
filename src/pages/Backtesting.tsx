import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Target, Zap, Shield, CheckCircle2, Star } from "lucide-react";

const IndicatorLandingPage = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "זיהוי מגמות מדויק",
      description: "אלגוריתם מתקדם שמזהה שינויי מגמה לפני שהם קורים"
    },
    {
      icon: Target,
      title: "נקודות כניסה ויציאה",
      description: "סיגנלים חדים וברורים - בלי ניחושים, רק ביצוע"
    },
    {
      icon: Zap,
      title: "התראות בזמן אמת",
      description: "לעולם לא תפספס הזדמנות - ההתראות מגיעות ישר אליך"
    },
    {
      icon: Shield,
      title: "ניהול סיכונים מובנה",
      description: "Stop Loss ו-Take Profit אוטומטיים לכל סיגנל"
    }
  ];

  const benefits = [
    "מתאים לכל סוגי הנכסים - פורקס, קריפטו, מניות",
    "עובד על כל טווחי הזמן",
    "התקנה פשוטה ב-2 דקות",
    "תמיכה אישית בעברית",
    "עדכונים שוטפים ללא תוספת תשלום"
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-y-auto" dir="rtl">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-12 md:py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Star className="h-4 w-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">האינדיקטור המוביל בישראל</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Gozlan Forever Model
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            הפסק לנחש. התחל לסחור עם ביטחון.
          </p>
          
          <p className="text-lg text-muted-foreground/80 mb-10 max-w-xl mx-auto">
            האינדיקטור שמשנה את הדרך שבה סוחרים מזהים הזדמנויות בשוק
          </p>

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="px-10 py-7 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
            onClick={() => window.open("https://whop.com/gozlan", "_blank")}
          >
            <ExternalLink className="ml-2 h-5 w-5" />
            קבל גישה עכשיו
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            גישה מיידית • ללא התחייבות • 100% אחריות
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4">
          למה סוחרים בוחרים ב-Gozlan Forever Model?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          כלי מסחר מתקדם שפותח על ידי סוחרים, בשביל סוחרים
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
            מה אתה מקבל?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 bg-card p-4 rounded-xl border border-border">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          מוכן לשדרג את המסחר שלך?
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          הצטרף למאות סוחרים שכבר משתמשים ב-Gozlan Forever Model
        </p>
        
        <Button 
          size="lg" 
          className="px-12 py-7 text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
          onClick={() => window.open("https://whop.com/gozlan", "_blank")}
        >
          <ExternalLink className="ml-2 h-5 w-5" />
          לרכישה מיידית
        </Button>
        
        <p className="text-sm text-muted-foreground mt-6">
          יש שאלות? דבר איתי ישירות דרך הקהילה או האינסטגרם
        </p>
      </div>
    </div>
  );
};

const Backtesting = () => {
  return (
    <DashboardLayout>
      <IndicatorLandingPage />
    </DashboardLayout>
  );
};

export default Backtesting;
