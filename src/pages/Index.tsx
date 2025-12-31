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
  ArrowUpRight,
} from "lucide-react";

// Import broker logos
import ninjatraderLogo from "@/assets/brokers/ninjatrader.png";
import topstepLogo from "@/assets/brokers/topstep.png";
import tradovateLogo from "@/assets/brokers/tradovate.png";
import robinhoodLogo from "@/assets/brokers/robinhood.png";
import metatrader5Logo from "@/assets/brokers/metatrader5.png";
import rithmicLogo from "@/assets/brokers/rithmic.png";
import bybitLogo from "@/assets/brokers/bybit.png";
import binanceLogo from "@/assets/brokers/binance.png";
import sierrachartLogo from "@/assets/brokers/sierrachart.png";
import interactivebrokersLogo from "@/assets/brokers/interactivebrokers.png";

const brokers = [
  { name: "NinjaTrader", logo: ninjatraderLogo },
  { name: "Topstep", logo: tradovateLogo },
  { name: "Tradovate", logo: topstepLogo },
  { name: "Robinhood", logo: robinhoodLogo },
  { name: "MetaTrader 5", logo: metatrader5Logo },
  { name: "Rithmic", logo: rithmicLogo },
  { name: "Bybit", logo: bybitLogo },
  { name: "Binance", logo: binanceLogo },
  { name: "Sierra Chart", logo: sierrachartLogo },
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
  const dashboardSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const brokersSection = useInView(0.2);
  const testimonialsSection = useInView(0.1);
  const ctaSection = useInView(0.2);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/login">התחברות</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                <Link to="/register">התחל בחינם</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative pt-20">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-success/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[200px]" />
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-foreground">הפלטפורמה המתקדמת ביותר לסוחרים</span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-center mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="text-foreground">שדרג את</span>
              <br />
              <span className="bg-gradient-to-l from-primary via-primary to-success bg-clip-text text-transparent">
                המסחר שלך
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground text-center max-w-2xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              עקוב, נתח ושפר את הביצועים שלך עם כלים חכמים וקהילת סוחרים מקצועית
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button size="lg" asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-8 py-6 shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:scale-105 transition-all">
                <Link to="/register">
                  <Zap className="h-5 w-5 ml-2" />
                  התחל בחינם
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-lg px-8 py-6 border-border/50 hover:bg-card hover:scale-105 transition-all">
                <Link to="/login">
                  <Play className="h-5 w-5 ml-2" />
                  צפה בהדגמה
                </Link>
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              {[
                { value: "10K+", label: "סוחרים פעילים", icon: Users },
                { value: "₪2.5M+", label: "רווחים מתועדים", icon: TrendingUp },
                { value: "99.9%", label: "זמן פעילות", icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="text-center group">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Scroll Indicator */}
            <div className="flex justify-center mt-16 animate-bounce">
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-24 relative" ref={dashboardSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`relative max-w-6xl mx-auto transition-all duration-1000 ${dashboardSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            {/* Glow behind */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent rounded-3xl blur-3xl opacity-50" />
            
            {/* Mock Dashboard */}
            <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-3xl p-8 shadow-2xl">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Live Preview
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "רווח כולל", value: "+$12,450", color: "text-success", icon: TrendingUp },
                  { label: "אחוז הצלחה", value: "78.5%", color: "text-primary", icon: Target },
                  { label: "עסקאות החודש", value: "127", color: "text-foreground", icon: BarChart3 },
                  { label: "מקדם רווח", value: "2.34", color: "text-warning", icon: PieChart },
                ].map((stat, i) => (
                  <div key={i} className="bg-secondary/30 rounded-2xl p-5 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="bg-secondary/20 rounded-2xl p-6 border border-border/30">
                <div className="flex items-end justify-between h-40 gap-2">
                  {[35, 55, 40, 70, 45, 80, 60, 90, 75, 95, 85, 70].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/30 rounded-t-lg transition-all hover:from-success hover:to-success/30"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative" ref={featuresSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-sm mb-6">
              <Award className="h-4 w-4 text-success" />
              <span className="text-foreground">יתרונות הפלטפורמה</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              כל מה שצריך במקום אחד
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              כלים מתקדמים שיעזרו לך להפוך לסוחר טוב יותר
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: LineChart,
                title: "ניתוח ביצועים מעמיק",
                description: "גרפים מתקדמים וסטטיסטיקות מפורטות על כל עסקה",
                gradient: "from-primary to-primary/50",
              },
              {
                icon: Zap,
                title: "סנכרון אוטומטי",
                description: "חיבור ישיר לברוקר עם עדכון בזמן אמת",
                gradient: "from-warning to-warning/50",
              },
              {
                icon: Users,
                title: "קהילת סוחרים",
                description: "שתף עסקאות ולמד מסוחרים מנוסים",
                gradient: "from-success to-success/50",
              },
              {
                icon: Target,
                title: "יעדים ומעקב",
                description: "הגדר יעדים אישיים ועקוב אחר ההתקדמות",
                gradient: "from-destructive to-destructive/50",
              },
              {
                icon: Shield,
                title: "ניהול סיכונים",
                description: "כלים לניהול סיכונים וחישוב גודל פוזיציה",
                gradient: "from-primary to-success",
              },
              {
                icon: Sparkles,
                title: "תובנות חכמות",
                description: "קבל המלצות מבוססות AI לשיפור המסחר",
                gradient: "from-warning to-primary",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className={`group relative bg-card/50 backdrop-blur border-border/50 p-8 hover:border-primary/30 transition-all duration-500 overflow-hidden ${featuresSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: featuresSection.isInView ? `${i * 100}ms` : '0ms' }}
              >
                {/* Hover gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}>
                  <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-foreground" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
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
      <section className="py-24 bg-card/30 border-y border-border/50" ref={brokersSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`text-center mb-12 transition-all duration-700 ${brokersSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              תומך בכל הברוקרים הגדולים
            </h2>
            <p className="text-muted-foreground">
              חבר את החשבון שלך או העלה קובץ עסקאות
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-5xl mx-auto">
            {brokers.map((broker, i) => (
              <div
                key={i}
                className={`group bg-card/50 backdrop-blur border border-border/50 rounded-2xl px-6 py-4 hover:border-primary/30 hover:bg-card transition-all flex items-center gap-3 ${brokersSection.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                style={{ transitionDelay: brokersSection.isInView ? `${i * 50}ms` : '0ms', transitionDuration: '500ms' }}
              >
                <img
                  src={broker.logo}
                  alt={broker.name}
                  className="w-8 h-8 object-contain grayscale group-hover:grayscale-0 transition-all"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {broker.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24" ref={testimonialsSection.ref}>
        <div className="container mx-auto px-6">
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              מה אומרים הסוחרים שלנו
            </h2>
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
                className={`bg-card/50 backdrop-blur border-border/50 p-6 transition-all duration-700 ${testimonialsSection.isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: testimonialsSection.isInView ? `${i * 150}ms` : '0ms' }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-warning fill-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-primary-foreground font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative" ref={ctaSection.ref}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${ctaSection.isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              מוכן להתחיל?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              הצטרף לאלפי סוחרים שכבר משתמשים בפלטפורמה ומשפרים את הביצועים שלהם
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-10 py-6 shadow-xl shadow-primary/30">
                <Link to="/register">
                  התחל בחינם עכשיו
                  <ArrowLeft className="h-5 w-5 mr-2" />
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              ללא כרטיס אשראי · התחל תוך 30 שניות
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" />
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">תנאי שימוש</a>
              <a href="#" className="hover:text-foreground transition-colors">פרטיות</a>
              <a href="#" className="hover:text-foreground transition-colors">צור קשר</a>
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
