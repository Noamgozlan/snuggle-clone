import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { useEffect, useState, useRef } from "react";
import {
  BarChart3,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowLeft,
  Zap,
  Shield,
  LineChart,
  Sparkles,
  ChevronDown,
  Play,
  Star,
  Clock,
  Award,
  PieChart,
} from "lucide-react";

// Import broker logos
import ninjatraderLogo from "@/assets/brokers/ninjatrader.png";
import topstepLogo from "@/assets/brokers/topstep.png";
import tradovateLogo from "@/assets/brokers/tradovate.png";
import metatrader5Logo from "@/assets/brokers/metatrader5.png";
import rithmicLogo from "@/assets/brokers/rithmic.png";
import bybitLogo from "@/assets/brokers/bybit.png";
import binanceLogo from "@/assets/brokers/binance.png";
import interactivebrokersLogo from "@/assets/brokers/interactivebrokers.png";

const brokers = [
  { name: "NinjaTrader", logo: ninjatraderLogo },
  { name: "Topstep", logo: topstepLogo },
  { name: "Tradovate", logo: tradovateLogo },
  { name: "MetaTrader 5", logo: metatrader5Logo },
  { name: "Rithmic", logo: rithmicLogo },
  { name: "Bybit", logo: bybitLogo },
  { name: "Binance", logo: binanceLogo },
  { name: "Interactive Brokers", logo: interactivebrokersLogo },
];

// Custom hook for intersection observer animations
const useInView = (threshold = 0.1) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
};

const Index = () => {
  const heroSection = useInView(0.1);
  const dashboardSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const brokersSection = useInView(0.2);
  const testimonialsSection = useInView(0.1);
  const ctaSection = useInView(0.2);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground hover:bg-transparent">
                <Link to="/login">התחברות</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl">
                <Link to="/register">התחל בחינם</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-20 overflow-hidden" ref={heroSection.ref}>
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Main gradient orbs */}
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-success/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Subtle grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.05)_1px,transparent_1px)] bg-[size:80px_80px]" />
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary/40 rounded-full animate-float" />
          <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-success/30 rounded-full animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-warning/40 rounded-full animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div 
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm mb-10 transition-all duration-700 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-foreground font-medium">הפלטפורמה המתקדמת ביותר לסוחרים</span>
            </div>

            {/* Main Headline */}
            <h1 
              className={`text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[1.1] tracking-tight transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '100ms' }}
            >
              <span className="text-foreground">שדרג את</span>
              <br />
              <span className="bg-gradient-to-l from-primary via-primary/80 to-success bg-clip-text text-transparent">
                המסחר שלך
              </span>
            </h1>

            {/* Subtitle */}
            <p 
              className={`text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '200ms' }}
            >
              עקוב, נתח ושפר את הביצועים שלך עם כלים חכמים וקהילת סוחרים מקצועית
            </p>

            {/* CTA Buttons */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-20 transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '300ms' }}
            >
              <Button 
                size="lg" 
                asChild 
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-10 py-7 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <Link to="/register">
                  <Zap className="h-5 w-5 ml-2" />
                  התחל בחינם
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                asChild 
                className="w-full sm:w-auto text-lg px-10 py-7 rounded-2xl border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 hover:border-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <Link to="/login">
                  <Play className="h-5 w-5 ml-2" />
                  צפה בהדגמה
                </Link>
              </Button>
            </div>

            {/* Stats Row */}
            <div 
              className={`grid grid-cols-3 gap-8 max-w-2xl mx-auto transition-all duration-1000 ${heroSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: '400ms' }}
            >
              {[
                { value: "10K+", label: "סוחרים פעילים", icon: Users },
                { value: "₪2.5M+", label: "רווחים מתועדים", icon: TrendingUp },
                { value: "99.9%", label: "זמן פעילות", icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="text-center group cursor-default">
                  <div className="inline-flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl md:text-4xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className="flex justify-center mt-20">
              <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
                <div className="w-1 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-32 relative" ref={dashboardSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`relative max-w-5xl mx-auto transition-all duration-1000 ${dashboardSection.isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95'}`}>
            {/* Glow behind */}
            <div className="absolute -inset-8 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-[3rem] blur-3xl" />
            
            {/* Mock Dashboard */}
            <div className="relative bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl p-8 shadow-2xl shadow-black/20">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full">
                  <Clock className="h-4 w-4" />
                  <span>Live Preview</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "רווח כולל", value: "+$12,450", color: "text-success", bg: "bg-success/10", icon: TrendingUp },
                  { label: "אחוז הצלחה", value: "78.5%", color: "text-primary", bg: "bg-primary/10", icon: Target },
                  { label: "עסקאות החודש", value: "127", color: "text-foreground", bg: "bg-secondary/50", icon: BarChart3 },
                  { label: "מקדם רווח", value: "2.34", color: "text-warning", bg: "bg-warning/10", icon: PieChart },
                ].map((stat, i) => (
                  <div 
                    key={i} 
                    className={`${stat.bg} rounded-2xl p-5 border border-border/20 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] cursor-default`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="bg-secondary/20 rounded-2xl p-6 border border-border/20">
                <div className="flex items-end justify-between h-44 gap-3">
                  {[35, 55, 40, 70, 45, 80, 60, 90, 75, 95, 85, 70].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/20 rounded-xl transition-all duration-500 hover:from-success hover:to-success/20 cursor-pointer"
                      style={{ 
                        height: `${height}%`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative" ref={featuresSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`text-center mb-20 transition-all duration-700 ${featuresSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-success/10 border border-success/20 text-sm mb-8">
              <Award className="h-4 w-4 text-success" />
              <span className="text-foreground font-medium">יתרונות הפלטפורמה</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              כל מה שצריך במקום אחד
            </h2>
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              כלים מתקדמים שיעזרו לך להפוך לסוחר טוב יותר
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: LineChart,
                title: "ניתוח ביצועים מעמיק",
                description: "גרפים מתקדמים וסטטיסטיקות מפורטות על כל עסקה",
                gradient: "from-primary to-primary/50",
                iconBg: "bg-primary/10",
              },
              {
                icon: Zap,
                title: "סנכרון אוטומטי",
                description: "חיבור ישיר לברוקר עם עדכון בזמן אמת",
                gradient: "from-warning to-warning/50",
                iconBg: "bg-warning/10",
              },
              {
                icon: Users,
                title: "קהילת סוחרים",
                description: "שתף עסקאות ולמד מסוחרים מנוסים",
                gradient: "from-success to-success/50",
                iconBg: "bg-success/10",
              },
              {
                icon: Target,
                title: "יעדים ומעקב",
                description: "הגדר יעדים אישיים ועקוב אחר ההתקדמות",
                gradient: "from-destructive to-destructive/50",
                iconBg: "bg-destructive/10",
              },
              {
                icon: Shield,
                title: "ניהול סיכונים",
                description: "כלים לניהול סיכונים וחישוב גודל פוזיציה",
                gradient: "from-primary to-success",
                iconBg: "bg-primary/10",
              },
              {
                icon: Sparkles,
                title: "תובנות חכמות",
                description: "קבל המלצות מבוססות AI לשיפור המסחר",
                gradient: "from-warning to-primary",
                iconBg: "bg-warning/10",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className={`group relative bg-card/40 backdrop-blur-xl border-border/30 p-8 rounded-3xl hover:bg-card/60 hover:border-primary/20 transition-all duration-500 overflow-hidden cursor-default ${featuresSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: featuresSection.isInView ? `${i * 80}ms` : '0ms' }}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                
                <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-7 w-7 text-foreground" />
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brokers Section */}
      <section className="py-32 relative" ref={brokersSection.ref}>
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-card/30 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`text-center mb-16 transition-all duration-700 ${brokersSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm mb-8">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">אינטגרציות</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
              תומך בכל הברוקרים הגדולים
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              חבר את החשבון שלך בקליק אחד או העלה קובץ עסקאות
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {brokers.map((broker, i) => (
              <div
                key={i}
                className={`group bg-card/40 backdrop-blur-xl border border-border/30 rounded-2xl px-8 py-5 hover:bg-card/70 hover:border-primary/30 hover:scale-105 transition-all duration-300 flex items-center gap-4 cursor-pointer ${brokersSection.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                style={{ transitionDelay: brokersSection.isInView ? `${i * 60}ms` : '0ms' }}
              >
                <img
                  src={broker.logo}
                  alt={broker.name}
                  className="w-10 h-10 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <span className="text-base font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {broker.name}
                </span>
              </div>
            ))}
          </div>
          
          {/* Coming soon hint */}
          <p className={`text-center text-sm text-muted-foreground/60 mt-10 transition-all duration-700 ${brokersSection.isInView ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '500ms' }}>
            + עוד ברוקרים בקרוב
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32" ref={testimonialsSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              מה אומרים הסוחרים שלנו
            </h2>
            <p className="text-lg text-muted-foreground">
              הצטרף לאלפי סוחרים מרוצים
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "יוסי כהן",
                role: "סוחר יומי",
                content: "הפלטפורמה שינתה את הדרך שבה אני מנתח את העסקאות שלי. מקדם הרווח שלי עלה ב-40%!",
                rating: 5,
              },
              {
                name: "מיכל לוי",
                role: "סוחרת סווינג",
                content: "הסטטיסטיקות המפורטות עזרו לי להבין את נקודות החולשה שלי ולשפר את אחוז ההצלחה.",
                rating: 5,
              },
              {
                name: "דוד אברהמי",
                role: "מנהל תיקים",
                content: "הקהילה פה מדהימה. למדתי המון מסוחרים אחרים והתוצאות מדברות בעד עצמן.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card 
                key={i} 
                className={`group bg-card/40 backdrop-blur-xl border-border/30 p-8 rounded-3xl hover:bg-card/60 hover:border-primary/20 transition-all duration-500 ${testimonialsSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: testimonialsSection.isInView ? `${i * 120}ms` : '0ms' }}
              >
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="h-5 w-5 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-8 leading-relaxed text-lg">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden" ref={ctaSection.ref}>
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px]" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${ctaSection.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-8 tracking-tight">
              מוכן להתחיל?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto">
              הצטרף לאלפי סוחרים שכבר משתמשים בפלטפורמה ומשפרים את הביצועים שלהם
            </p>
            
            <Button 
              size="lg" 
              asChild 
              className="bg-primary hover:bg-primary/90 text-lg px-12 py-8 rounded-2xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <Link to="/register">
                התחל בחינם עכשיו
                <ArrowLeft className="h-5 w-5 mr-2" />
              </Link>
            </Button>
            
            <p className="text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              ללא כרטיס אשראי · התחל תוך 30 שניות
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/30">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Logo size="sm" />
            <div className="flex items-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors duration-300">תנאי שימוש</a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">פרטיות</a>
              <a href="#" className="hover:text-foreground transition-colors duration-300">צור קשר</a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 GozlanJournal. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
