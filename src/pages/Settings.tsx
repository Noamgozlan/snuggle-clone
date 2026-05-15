import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowRight,
  ArrowLeft,
  Type,
  Check,
  BookOpen,
  Palette,
  Sun,
  Moon,
  Globe,
  Lock,
  LayoutGrid,
  MinusSquare,
  Zap,
  Monitor,
  Languages,
} from "lucide-react";
import { useFont, fontOptions, FontFamily } from "@/contexts/FontContext";
import { useTheme, colorSchemeOptions, visualStyleOptions } from "@/contexts/ThemeContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { MentorSettings as MentorSettingsSection } from "@/components/mentor/MentorSettings";
import { StudentFeedbackView } from "@/components/mentor/StudentFeedbackView";
import { BrokerIntegrations } from "@/components/settings/BrokerIntegrations";
import { DataExportCard } from "@/components/settings/DataExportCard";
import { Scale } from "lucide-react";
import { useState, useEffect } from "react";

export interface BreakEvenConfig {
  min: number;
  max: number;
}

const STORAGE_KEY = "be-config";
const DEFAULT_CONFIG: BreakEvenConfig = { min: 0, max: 0 };

export const useBreakEvenConfig = () => {
  const [config, setConfig] = useState<BreakEvenConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        setConfig(DEFAULT_CONFIG);
      }
    }
  }, []);

  const setRange = (min: number, max: number) => {
    const newConfig = { min, max };
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  return { ...config, setRange };
};

const visualStyleIcons: Record<string, React.ReactNode> = {
  layout: <LayoutGrid className="h-6 w-6" />,
  monitor: <Monitor className="h-6 w-6" />,
  "minus-square": <MinusSquare className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
};

const Settings = () => {
  const { font, setFont } = useFont();
  const { theme, colorScheme, visualStyle, toggleTheme, setColorScheme, setVisualStyle } = useTheme();
  const { startTour } = useOnboarding();
  const { profile, updateProfile } = useProfile();
  const { min: beMin, max: beMax, setRange: setBeRange } = useBreakEvenConfig();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const handlePublicToggle = async (checked: boolean) => {
    const success = await updateProfile({ is_public: checked });
    if (success) {
      toast.success(t(checked ? "settings.profilePublic" : "settings.profilePrivate"));
    } else {
      toast.error(t("settings.updateError"));
    }
  };

  const handleFontChange = (newFont: FontFamily) => {
    setFont(newFont);
    toast.success(t("settings.fontChanged"));
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <BackArrow className="h-4 w-4" />
          <span>{t("settings.title")}</span>
        </div>

        {/* Font Settings */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Type className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("settings.font")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.fontDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {fontOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleFontChange(option.value)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/50 hover:bg-primary/5",
                  font === option.value ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                {font === option.value && (
                  <div className="absolute top-2 start-2 p-1 rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <p className={cn("text-lg font-medium text-foreground", option.className)}>{option.label}</p>
                <p className={cn("text-sm text-muted-foreground mt-1", option.className)}>{t("settings.sampleText")}</p>
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
              <h2 className="text-xl font-bold text-foreground">{t("settings.theme")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.themeDesc")}</p>
            </div>
          </div>

          {/* Light/Dark Mode Toggle */}
          <div className="mt-6 mb-6">
            <p className="text-sm font-medium text-foreground mb-3">{t("settings.displayMode")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/50",
                  theme === "dark" ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <Moon className="h-5 w-5" />
                <span className="font-medium">{t("settings.darkMode")}</span>
                {theme === "dark" && (
                  <div className="p-1 rounded-full bg-primary ms-auto">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/50",
                  theme === "light" ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <Sun className="h-5 w-5" />
                <span className="font-medium">{t("settings.lightMode")}</span>
                {theme === "light" && (
                  <div className="p-1 rounded-full bg-primary ms-auto">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Color Schemes */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">{t("settings.primaryColor")}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {colorSchemeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setColorScheme(option.value);
                    toast.success(t("settings.colorSchemeChanged"));
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:border-primary/50 hover:scale-[1.02]",
                    colorScheme === option.value ? "border-primary bg-primary/10" : "border-border bg-card",
                  )}
                >
                  {colorScheme === option.value && (
                    <div className="absolute top-2 start-2 p-1 rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: option.primary }} />
                    <span className="font-medium text-foreground">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Styles */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-medium text-foreground mb-3">{t("settings.visualStyle")}</p>
            <div className="grid grid-cols-2 gap-3">
              {visualStyleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setVisualStyle(option.value);
                    toast.success(t("settings.visualStyleChanged"));
                  }}
                  className={cn(
                    "relative p-4 rounded-xl border-2 transition-all duration-200",
                    "hover:border-primary/50 hover:scale-[1.02]",
                    visualStyle === option.value ? "border-primary bg-primary/10" : "border-border bg-card",
                  )}
                >
                  {visualStyle === option.value && (
                    <div className="absolute top-2 start-2 p-1 rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        visualStyle === option.value ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
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

        {/* Language Settings */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Languages className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("settings.language")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.languageDesc")}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setLanguage("he");
                toast.success("השפה שונתה לעברית");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                "hover:border-primary/50",
                language === "he" ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <span className="text-lg">🇮🇱</span>
              <span className="font-medium">{t("settings.hebrew")}</span>
              {language === "he" && (
                <div className="p-1 rounded-full bg-primary ms-auto">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
            <button
              onClick={() => {
                setLanguage("en");
                toast.success("Language changed to English");
              }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
                "hover:border-primary/50",
                language === "en" ? "border-primary bg-primary/10" : "border-border bg-card",
              )}
            >
              <span className="text-lg">🇺🇸</span>
              <span className="font-medium">{t("settings.english")}</span>
              {language === "en" && (
                <div className="p-1 rounded-full bg-primary ms-auto">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          </div>
        </Card>

        {/* Break Even Settings */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{t("settings.breakEven")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.breakEvenDesc")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="be-min">{t("settings.beMin")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="be-min"
                  type="number"
                  value={beMin}
                  onChange={(e) => setBeRange(Number(e.target.value), beMax)}
                  className="pl-8 text-left"
                  placeholder="-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.beMinExample")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="be-max">{t("settings.beMax")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="be-max"
                  type="number"
                  value={beMax}
                  onChange={(e) => setBeRange(beMin, Number(e.target.value))}
                  className="pl-8 text-left"
                  placeholder="10"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("settings.beMaxExample")}</p>
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
              <h2 className="text-xl font-bold text-foreground">{t("settings.privacy")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.privacyDesc")}</p>
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
                <p className="font-medium text-foreground">{profile?.is_public ? t("settings.publicProfile") : t("settings.privateProfile")}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.is_public ? t("settings.publicDesc") : t("settings.privateDesc")}
                </p>
              </div>
            </div>
            <Switch checked={profile?.is_public ?? false} onCheckedChange={handlePublicToggle} />
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
              <h2 className="text-xl font-bold text-foreground">{t("settings.userGuide")}</h2>
              <p className="text-muted-foreground text-sm">{t("settings.userGuideDesc")}</p>
            </div>
          </div>
          <Button variant="outline" className="mt-4" onClick={startTour}>
            {t("settings.showGuide")}
          </Button>
        </Card>

        {/* Move My Data */}
        <DataExportCard />

        {/* Change Password */}
        <Card className="bg-card border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t("settings.changePassword")}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t("settings.changePasswordDesc")}</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t("settings.currentPassword")}</Label>
              <Input id="currentPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
              <Input id="newPassword" type="password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("settings.confirmPassword")}</Label>
              <Input id="confirmPassword" type="password" />
            </div>

            <Button variant="default">{t("settings.changeBtn")}</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
