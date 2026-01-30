import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accessibility,
  Type,
  Contrast,
  MousePointer2,
  Link2,
  RotateCcw,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
  lineHeight: number;
  letterSpacing: number;
  readableFont: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  highlightLinks: false,
  bigCursor: false,
  lineHeight: 100,
  letterSpacing: 0,
  readableFont: false,
};

export const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem("accessibility-settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (s: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${s.fontSize}%`;

    // High contrast
    if (s.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Highlight links
    if (s.highlightLinks) {
      root.classList.add("highlight-links");
    } else {
      root.classList.remove("highlight-links");
    }

    // Big cursor
    if (s.bigCursor) {
      root.classList.add("big-cursor");
    } else {
      root.classList.remove("big-cursor");
    }

    // Line height
    root.style.setProperty("--accessibility-line-height", `${s.lineHeight}%`);

    // Letter spacing
    root.style.setProperty("--accessibility-letter-spacing", `${s.letterSpacing}px`);

    // Readable font
    if (s.readableFont) {
      root.classList.add("readable-font");
    } else {
      root.classList.remove("readable-font");
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const adjustFontSize = (delta: number) => {
    setSettings((prev) => ({
      ...prev,
      fontSize: Math.min(150, Math.max(80, prev.fontSize + delta)),
    }));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "fixed bottom-4 left-4 z-[9999] h-12 w-12 rounded-full shadow-lg",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "border-2 border-primary-foreground/20"
          )}
          aria-label="פתח תפריט נגישות"
        >
          <Accessibility className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 p-4 mb-2"
        dir="rtl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-semibold text-lg">הגדרות נגישות</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס
            </Button>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              גודל טקסט ({settings.fontSize}%)
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => adjustFontSize(-10)}
                disabled={settings.fontSize <= 80}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) =>
                  setSettings((prev) => ({ ...prev, fontSize: value }))
                }
                min={80}
                max={150}
                step={10}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => adjustFontSize(10)}
                disabled={settings.fontSize >= 150}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label className="text-sm">גובה שורה ({settings.lineHeight}%)</Label>
            <Slider
              value={[settings.lineHeight]}
              onValueChange={([value]) =>
                setSettings((prev) => ({ ...prev, lineHeight: value }))
              }
              min={100}
              max={200}
              step={25}
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-2">
            <Label className="text-sm">ריווח אותיות ({settings.letterSpacing}px)</Label>
            <Slider
              value={[settings.letterSpacing]}
              onValueChange={([value]) =>
                setSettings((prev) => ({ ...prev, letterSpacing: value }))
              }
              min={0}
              max={5}
              step={1}
            />
          </div>

          {/* Toggle Options */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Contrast className="h-4 w-4" />
                ניגודיות גבוהה
              </Label>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, highContrast: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Link2 className="h-4 w-4" />
                הדגשת קישורים
              </Label>
              <Switch
                checked={settings.highlightLinks}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, highlightLinks: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 cursor-pointer">
                <MousePointer2 className="h-4 w-4" />
                סמן גדול
              </Label>
              <Switch
                checked={settings.bigCursor}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, bigCursor: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 cursor-pointer">
                <Type className="h-4 w-4" />
                גופן קריא
              </Label>
              <Switch
                checked={settings.readableFont}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, readableFont: checked }))
                }
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
