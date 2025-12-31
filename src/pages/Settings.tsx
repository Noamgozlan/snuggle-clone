import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Type, Check, BookOpen, Palette, Sun, Moon, Globe, Lock, LayoutGrid, MinusSquare, Zap, Square } from "lucide-react";
import { useFont, fontOptions, FontFamily } from "@/contexts/FontContext";
import { useTheme, colorSchemeOptions, visualStyleOptions } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useProfile } from "@/contexts/ProfileContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MentorSettings as MentorSettingsSection } from "@/components/mentor/MentorSettings";
import { StudentFeedbackView } from "@/components/mentor/StudentFeedbackView";
import { BrokerIntegrations } from "@/components/settings/BrokerIntegrations";

const visualStyleIcons: Record<string, React.ReactNode> = {
  layout: <LayoutGrid className="h-6 w-6" />,
  "minus-square": <MinusSquare className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  square: <Square className="h-6 w-6" />,
};

const Settings = () => {
  const { font, setFont } = useFont();
  const { theme, colorScheme, visualStyle, toggleTheme, setColorScheme, setVisualStyle } = useTheme();
  const { startTour } = useOnboarding();
  const { profile, updateProfile } = useProfile();

  const handlePublicToggle = async (checked: boolean) => {
    const success = await updateProfile({ is_public: checked });
    if (success) {
      toast.success(checked ? "הפרופיל שלך כעת ציבורי" : "הפרופיל שלך כעת פרטי");
    } else {
      toast.error("שגיאה בעדכון ההגדרות");
    }
  };

  const handleFontChange = (newFont: FontFamily) => {
    setFont(newFont);
    toast.success("הפונט שונה בהצלחה");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          <span>הגדרות מסחר</span>
        </div>

        {/* Font Settings */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Type className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">פונט</h2>
              <p className="text-muted-foreground text-sm">
                בחר את הפונט המועדף עליך לכל האתר
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFontChange(option.value)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200 text-right",
                  "hover:border-primary/50 hover:bg-primary/5",
                  font === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                {font === option.value && (
                  <div className="absolute top-2 left-2 p-1 rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <p className={cn("text-lg font-medium text-foreground", option.className)}>
                  {option.label}
                </p>
                <p className={cn("text-sm text-muted-foreground mt-1", option.className)}>
                  זהו טקסט לדוגמה
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Theme Settings */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">ערכת עיצוב</h2>
              <p className="text-muted-foreground text-sm">
                בחר את הצבעים והסגנון המועדפים עליך
              </p>
            </div>
          </div>

          {/* Light/Dark Mode Toggle */}
          <div className="mt-6 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">מצב תצוגה</p>
            <div className="flex gap-3">
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/50",
                  theme === "dark"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <Moon className="h-5 w-5" />
                <span className="font-medium">מצב כהה</span>
                {theme === "dark" && (
                  <div className="p-1 rounded-full bg-primary mr-auto">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/50",
                  theme === "light"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <Sun className="h-5 w-5" />
                <span className="font-medium">מצב בהיר</span>
                {theme === "light" && (
                  <div className="p-1 rounded-full bg-primary mr-auto">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Color Schemes */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">צבע ראשי</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorSchemeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setColorScheme(option.value);
                    toast.success(`ערכת הצבעים שונתה ל${option.label}`);
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:border-primary/50 hover:scale-[1.02]",
                    colorScheme === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  )}
                >
                  {colorScheme === option.value && (
                    <div className="absolute top-2 left-2 p-1 rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full shadow-lg"
                      style={{ backgroundColor: option.primary }}
                    />
                    <span className="font-medium text-foreground">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Styles */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-3">סגנון עיצוב</p>
            <div className="grid grid-cols-2 gap-3">
              {visualStyleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setVisualStyle(option.value);
                    toast.success(`סגנון העיצוב שונה ל${option.label}`);
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200 text-right",
                    "hover:border-primary/50 hover:scale-[1.02]",
                    visualStyle === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card"
                  )}
                >
                  {visualStyle === option.value && (
                    <div className="absolute top-2 left-2 p-1 rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      visualStyle === option.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {visualStyleIcons[option.icon]}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {profile?.is_public ? (
                <Globe className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">פרטיות פרופיל</h2>
              <p className="text-muted-foreground text-sm">
                קבע אם אחרים יכולים לראות את הפרופיל וצבעי הגרף שלך
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              {profile?.is_public ? (
                <Globe className="h-5 w-5 text-green-500" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {profile?.is_public ? "פרופיל ציבורי" : "פרופיל פרטי"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.is_public 
                    ? "אחרים יכולים לראות את הפרופיל וצבעי הגרף שלך" 
                    : "רק אתה יכול לראות את הפרופיל שלך"}
                </p>
              </div>
            </div>
            <Switch
              checked={profile?.is_public ?? false}
              onCheckedChange={handlePublicToggle}
            />
          </div>
        </Card>

        {/* Broker Integrations */}
        <BrokerIntegrations />

        {/* Mentor Settings */}
        <MentorSettingsSection />

        {/* Student Feedback from Mentor */}
        <StudentFeedbackView />

        {/* User Guide */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">מדריך משתמש</h2>
              <p className="text-muted-foreground text-sm">
                הצג שוב את המדריך האינטראקטיבי למערכת
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={startTour}
          >
            הצג מדריך שוב
          </Button>
        </Card>

        {/* Change Password */}
        <Card className="bg-card border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">שינוי סיסמה</h2>
          <p className="text-muted-foreground text-sm mb-6">שנה את הסיסמה שלך למערכת</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">סיסמה נוכחית</Label>
              <Input id="currentPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input id="newPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה חדשה</Label>
              <Input id="confirmPassword" type="password" />
            </div>

            <Button variant="default">שנה סיסמה</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
