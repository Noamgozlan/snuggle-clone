import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Copy, Check, Lock, TrendingUp, Palette } from "lucide-react";
import { toast } from "sonner";

interface ChartColors {
  body_up: string;
  body_down: string;
  border_up: string;
  border_down: string;
  wick_up: string;
  wick_down: string;
  background: string;
}

interface PublicProfile {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  favorite_asset: string | null;
  is_public: boolean;
  chart_colors: ChartColors | null;
}

interface PublicProfileDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultChartColors: ChartColors = {
  body_up: "#26a69a",
  body_down: "#ef5350",
  border_up: "#26a69a",
  border_down: "#ef5350",
  wick_up: "#26a69a",
  wick_down: "#ef5350",
  background: "#1e1e1e",
};

export const PublicProfileDialog = ({ userId, open, onOpenChange }: PublicProfileDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, username, avatar_url, favorite_asset, is_public, chart_colors")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const rawChartColors = data.chart_colors as Record<string, string> | null;
        setProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          avatar_url: data.avatar_url,
          favorite_asset: data.favorite_asset,
          is_public: data.is_public,
          chart_colors: rawChartColors ? {
            body_up: rawChartColors.body_up || defaultChartColors.body_up,
            body_down: rawChartColors.body_down || defaultChartColors.body_down,
            border_up: rawChartColors.border_up || defaultChartColors.border_up,
            border_down: rawChartColors.border_down || defaultChartColors.border_down,
            wick_up: rawChartColors.wick_up || defaultChartColors.wick_up,
            wick_down: rawChartColors.wick_down || defaultChartColors.wick_down,
            background: rawChartColors.background || defaultChartColors.background,
          } : null,
        });
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyColor = (colorName: string, colorValue: string) => {
    navigator.clipboard.writeText(colorValue);
    setCopiedColor(colorName);
    toast.success(`צבע ${colorName} הועתק!`);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const getDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    }
    if (profile?.username) {
      return profile.username;
    }
    return "סוחר אנונימי";
  };

  const getInitials = () => {
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    return "?";
  };

  const chartColors = profile?.chart_colors || defaultChartColors;

  const colorItems = [
    { key: "background", label: "רקע", value: chartColors.background },
    { key: "body_up", label: "גוף עלייה", value: chartColors.body_up },
    { key: "body_down", label: "גוף ירידה", value: chartColors.body_down },
    { key: "border_up", label: "גבול עלייה", value: chartColors.border_up },
    { key: "border_down", label: "גבול ירידה", value: chartColors.border_down },
    { key: "wick_up", label: "פתיל עלייה", value: chartColors.wick_up },
    { key: "wick_down", label: "פתיל ירידה", value: chartColors.wick_down },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>פרופיל</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !profile?.is_public ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">פרופיל פרטי</h3>
            <p className="text-sm text-muted-foreground">
              המשתמש הזה בחר לשמור את הפרופיל שלו פרטי
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg text-foreground">{getDisplayName()}</h3>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
                {profile.favorite_asset && (
                  <Badge variant="secondary" className="mt-2 gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {profile.favorite_asset}
                  </Badge>
                )}
              </div>
            </div>

            {/* Chart Colors */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h4 className="font-medium text-foreground">צבעי גרף</h4>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: chartColors.background }}>
                <div className="flex justify-center gap-4">
                  {/* Up candle */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-0.5 h-3" 
                      style={{ backgroundColor: chartColors.wick_up }}
                    />
                    <div 
                      className="w-5 h-8 rounded-sm"
                      style={{ 
                        backgroundColor: chartColors.body_up,
                        border: `2px solid ${chartColors.border_up}`
                      }}
                    />
                    <div 
                      className="w-0.5 h-1.5" 
                      style={{ backgroundColor: chartColors.wick_up }}
                    />
                  </div>
                  {/* Down candle */}
                  <div className="flex flex-col items-center">
                    <div 
                      className="w-0.5 h-1.5" 
                      style={{ backgroundColor: chartColors.wick_down }}
                    />
                    <div 
                      className="w-5 h-8 rounded-sm"
                      style={{ 
                        backgroundColor: chartColors.body_down,
                        border: `2px solid ${chartColors.border_down}`
                      }}
                    />
                    <div 
                      className="w-0.5 h-3" 
                      style={{ backgroundColor: chartColors.wick_down }}
                    />
                  </div>
                </div>
              </div>

              {/* Color List */}
              <div className="grid grid-cols-2 gap-2">
                {colorItems.map((item) => (
                  <Button
                    key={item.key}
                    variant="outline"
                    size="sm"
                    className="justify-between h-auto py-2"
                    onClick={() => copyColor(item.label, item.value)}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded border border-border"
                        style={{ backgroundColor: item.value }}
                      />
                      <span className="text-xs">{item.label}</span>
                    </div>
                    {copiedColor === item.label ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  const colorsText = colorItems.map(c => `${c.label}: ${c.value}`).join("\n");
                  navigator.clipboard.writeText(colorsText);
                  toast.success("כל הצבעים הועתקו!");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                העתק את כל הצבעים
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
