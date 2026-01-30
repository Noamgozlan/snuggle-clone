import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ExternalLink, 
  TrendingUp, 
  Target, 
  Zap, 
  Shield, 
  CheckCircle2, 
  Star,
  Quote,
  Rocket,
  Clock,
  Award
} from "lucide-react";

const IndicatorLandingPage = () => {
  const features = [
    {
      icon: TrendingUp,
      title: "זיהוי מגמות לפני כולם",
      description: "האלגוריתם המתקדם שלנו מזהה שינויי מגמה עוד לפני שהם נראים לעין - כך שאתה תמיד צעד אחד לפני השוק"
    },
    {
      icon: Target,
      title: "סיגנלים חדים כתער",
      description: "נקודות כניסה ויציאה מדויקות. בלי ספקות, בלי היסוסים - רק ביצוע מושלם"
    },
    {
      icon: Zap,
      title: "התראות שלא מפספסות",
      description: "קבל התראה ישירות לטלפון ברגע שמופיעה הזדמנות. לעולם לא תפספס עסקה מנצחת"
    },
    {
      icon: Shield,
      title: "הגנה מובנית על ההון",
      description: "Stop Loss ו-Take Profit אוטומטיים לכל סיגנל. שינה שקטה מובטחת"
    }
  ];

  const benefits = [
    { icon: Rocket, text: "מתאים לכל נכס - פורקס, קריפטו, מניות, סחורות" },
    { icon: Clock, text: "עובד על כל טווח זמן - מ-1 דקה ועד יומי" },
    { icon: Zap, text: "התקנה פשוטה ב-2 דקות בלבד" },
    { icon: Award, text: "תמיכה אישית וצמודה בעברית" },
    { icon: CheckCircle2, text: "עדכונים שוטפים ללא תוספת תשלום - לכל החיים" }
  ];

  const testimonials = [
    {
      name: "יוסי מ.",
      role: "סוחר פורקס",
      content: "אחרי שנים של חיפושים, סוף סוף מצאתי אינדיקטור שבאמת עובד. הסיגנלים מדויקים ברמה מטורפת. תוך חודש הכפלתי את אחוזי ההצלחה שלי.",
      rating: 5
    },
    {
      name: "דניאל ר.",
      role: "סוחר קריפטו",
      content: "הייתי סקפטי בהתחלה, אבל התוצאות מדברות בעד עצמן. האינדיקטור הזה שינה לי את המשחק לחלוטין. ממליץ בחום!",
      rating: 5
    },
    {
      name: "מיכאל ש.",
      role: "סוחר מניות",
      content: "הדבר הכי טוב שקניתי למסחר שלי. התמיכה האישית מגוזלן היא ברמה אחרת לגמרי. תמיד זמין לעזור ולהסביר.",
      rating: 5
    },
    {
      name: "אורי כ.",
      role: "סוחר פיוצ'רס",
      content: "עברתי הרבה אינדיקטורים לפני שהגעתי לזה. ההבדל הוא שמיים וארץ. הסיגנלים נקיים, ברורים ובעיקר - רווחיים.",
      rating: 5
    }
  ];

  const stats = [
    { value: "500+", label: "סוחרים פעילים" },
    { value: "85%", label: "אחוז הצלחה ממוצע" },
    { value: "24/7", label: "תמיכה זמינה" }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-y-auto" dir="rtl">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-background overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/25 via-transparent to-transparent" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          {/* Badge with animation */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-5 py-2.5 mb-8 animate-fade-in shadow-lg shadow-primary/10">
            <Star className="h-4 w-4 text-primary fill-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">האינדיקטור #1 בישראל</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-black text-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Gozlan Forever Model
          </h1>
          
          <p className="text-2xl md:text-3xl font-bold text-foreground/90 mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            הפסק לנחש. התחל להרוויח.
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
            האינדיקטור שהופך סוחרים ממתחילים למקצוענים.
            <br />
            <span className="text-primary font-semibold">סיגנלים מדויקים. תוצאות אמיתיות.</span>
          </p>

          {/* CTA Button */}
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              size="lg" 
              className="px-12 py-8 text-xl font-black shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-500 hover:scale-110 bg-gradient-to-r from-primary to-primary/80"
              onClick={() => window.open("https://whop.com/gozlan", "_blank")}
            >
              <ExternalLink className="ml-3 h-6 w-6" />
              לקבלת גישה מיידית
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            ✓ גישה מיידית &nbsp;&nbsp; ✓ ללא התחייבות &nbsp;&nbsp; ✓ תמיכה מלאה
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-lg mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-primary">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-10">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            צפה והשתכנע
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            ראה את האינדיקטור בפעולה
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            אל תסמוך על מילים - ראה בעצמך איך Gozlan Forever Model מזהה הזדמנויות בזמן אמת
          </p>
        </div>
        
        <div className="relative rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-shadow duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none z-10" />
          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/OZNMRReCWkc"
              title="Gozlan Forever Model Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              למה דווקא אנחנו
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              היתרון הבלתי הוגן שלך בשוק
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              טכנולוגיה מתקדמת שפותחה על ידי סוחרים אמיתיים, עם ניסיון של שנים בשווקים
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-500 group-hover:scale-110">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            מה אומרים הסוחרים
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
            סיפורי הצלחה אמיתיים
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            אלפי סוחרים כבר משתמשים ב-Gozlan Forever Model. הנה מה שהם אומרים:
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
            >
              <Quote className="absolute top-6 left-6 h-10 w-10 text-primary/10 group-hover:text-primary/20 transition-colors" />
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed text-lg">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-primary/60">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                    {testimonial.name.split(' ')[0][0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              הכל כלול
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
              מה אתה מקבל היום?
            </h2>
          </div>
          
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 bg-card p-5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg text-foreground font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
        
        <div className="relative max-w-3xl mx-auto px-4 py-20 md:py-28 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6">
            הזמן לשדרג את המסחר שלך
            <br />
            <span className="text-primary">הוא עכשיו.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            אל תחכה לעוד חודש של הפסדים. הצטרף עכשיו לקהילת הסוחרים המצליחים עם Gozlan Forever Model.
          </p>
          
          <Button 
            size="lg" 
            className="px-14 py-8 text-xl font-black shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all duration-500 hover:scale-110 bg-gradient-to-r from-primary to-primary/80"
            onClick={() => window.open("https://whop.com/gozlan", "_blank")}
          >
            <ExternalLink className="ml-3 h-6 w-6" />
            קבל גישה עכשיו
          </Button>
          
          <p className="text-muted-foreground mt-8">
            יש שאלות? <span className="text-primary font-semibold">דבר איתי ישירות</span> דרך הקהילה או האינסטגרם
          </p>
        </div>
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
