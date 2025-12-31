import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, User, TrendingUp, Palette, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, ChartColors } from "@/contexts/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileData {
  first_name: string;
  last_name: string;
  username: string;
  avatar_url: string | null;
  favorite_asset: string;
  chart_colors: ChartColors;
}

const popularAssets = [
  { value: "NQ", label: "NQ (Nasdaq)" },
  { value: "ES", label: "ES (S&P 500)" },
  { value: "YM", label: "YM (Dow Jones)" },
  { value: "RTY", label: "RTY (Russell 2000)" },
  { value: "CL", label: "CL (Crude Oil)" },
  { value: "GC", label: "GC (Gold)" },
  { value: "BTC", label: "BTC (Bitcoin)" },
  { value: "ETH", label: "ETH (Ethereum)" },
];

const Profile = () => {
  const { user } = useAuth();
  const { profile: contextProfile, updateProfile, refreshProfile } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    username: "",
    avatar_url: null,
    favorite_asset: "",
    chart_colors: {
      body_up: "#26a69a",
      body_down: "#ef5350",
      border_up: "#26a69a",
      border_down: "#ef5350",
      wick_up: "#26a69a",
      wick_down: "#ef5350",
      background: "#1e1e1e",
    },
  });

  useEffect(() => {
    if (contextProfile) {
      setProfile({
        first_name: contextProfile.first_name || "",
        last_name: contextProfile.last_name || "",
        username: contextProfile.username || "",
        avatar_url: contextProfile.avatar_url,
        favorite_asset: contextProfile.favorite_asset || "",
        chart_colors: contextProfile.chart_colors,
      });
      setLoading(false);
    }
  }, [contextProfile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("יש להעלות קובץ תמונה בלבד");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("גודל הקובץ המקסימלי הוא 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      await handleAvatarUpdate(publicUrl);
      toast.success("התמונה הועלתה בהצלחה");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const success = await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        favorite_asset: profile.favorite_asset || null,
        chart_colors: profile.chart_colors,
      });

      if (success) {
        toast.success("הפרטים נשמרו בהצלחה");
      } else {
        toast.error("שגיאה בשמירת הפרטים");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("שגיאה בשמירת הפרטים");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpdate = async (publicUrl: string) => {
    await updateProfile({ avatar_url: publicUrl });
    setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
  };

  const handleColorChange = (key: keyof ChartColors, value: string) => {
    setProfile((prev) => ({
      ...prev,
      chart_colors: { ...prev.chart_colors, [key]: value },
    }));
  };

  const getInitials = () => {
    const first = profile.first_name?.[0] || "";
    const last = profile.last_name?.[0] || "";
    return (first + last).toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card border-border overflow-hidden">
          {/* Header with gradient */}
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          
          <div className="px-6 pb-6">
            {/* Avatar Section */}
            <div className="relative -mt-12 mb-6">
              <div className="relative inline-block group">
                <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} alt="Profile" />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">פרטים אישיים</h1>
              <p className="text-muted-foreground text-sm mt-1">ערוך את הפרופיל שלך</p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* Email - Read only */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm">
                  אימייל
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    readOnly
                    className="text-left bg-muted/50 border-border/50"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  שם משתמש
                </Label>
                <Input
                  id="username"
                  value={profile.username || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="@username"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">שם פרטי</Label>
                  <Input
                    id="firstName"
                    value={profile.first_name || ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, first_name: e.target.value }))
                    }
                    placeholder="שם פרטי"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">שם משפחה</Label>
                  <Input
                    id="lastName"
                    value={profile.last_name || ""}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, last_name: e.target.value }))
                    }
                    placeholder="שם משפחה"
                  />
                </div>
              </div>

              {/* Favorite Asset */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  נכס מועדף
                </Label>
                <Select
                  value={profile.favorite_asset}
                  onValueChange={(value) =>
                    setProfile((prev) => ({ ...prev, favorite_asset: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נכס מועדף" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularAssets.map((asset) => (
                      <SelectItem key={asset.value} value={asset.value}>
                        {asset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full mt-4"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    שומר...
                  </>
                ) : (
                  "שמור שינויים"
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Chart Colors Card */}
        <Card className="bg-card border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">צבעי גרף</h2>
              <p className="text-muted-foreground text-sm">
                התאם את צבעי הגרף שלך כדי שאחרים יוכלו להעתיק
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Background */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">רקע</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profile.chart_colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={profile.chart_colors.background}
                  onChange={(e) => handleColorChange("background", e.target.value)}
                  className="w-32 text-left font-mono text-sm"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Body Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">גוף הנר (Body)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">עלייה</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.chart_colors.body_up}
                      onChange={(e) => handleColorChange("body_up", e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={profile.chart_colors.body_up}
                      onChange={(e) => handleColorChange("body_up", e.target.value)}
                      className="flex-1 text-left font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">ירידה</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.chart_colors.body_down}
                      onChange={(e) => handleColorChange("body_down", e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={profile.chart_colors.body_down}
                      onChange={(e) => handleColorChange("body_down", e.target.value)}
                      className="flex-1 text-left font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Border Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">גבול (Borders)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">עלייה</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.chart_colors.border_up}
                      onChange={(e) => handleColorChange("border_up", e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={profile.chart_colors.border_up}
                      onChange={(e) => handleColorChange("border_up", e.target.value)}
                      className="flex-1 text-left font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">ירידה</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.chart_colors.border_down}
                      onChange={(e) => handleColorChange("border_down", e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={profile.chart_colors.border_down}
                      onChange={(e) => handleColorChange("border_down", e.target.value)}
                      className="flex-1 text-left font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wick Colors */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">פתיל (Wick)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">עלייה</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.chart_colors.wick_up}
                      onChange={(e) => handleColorChange("wick_up", e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={profile.chart_colors.wick_up}
                      onChange={(e) => handleColorChange("wick_up", e.target.value)}
                      className="flex-1 text-left font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">ירידה</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={profile.chart_colors.wick_down}
                      onChange={(e) => handleColorChange("wick_down", e.target.value)}
                      className="w-10 h-8 rounded border border-border cursor-pointer"
                    />
                    <Input
                      value={profile.chart_colors.wick_down}
                      onChange={(e) => handleColorChange("wick_down", e.target.value)}
                      className="flex-1 text-left font-mono text-xs"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: profile.chart_colors.background }}>
              <p className="text-xs text-center mb-3" style={{ color: "#888" }}>תצוגה מקדימה</p>
              <div className="flex justify-center gap-4">
                {/* Up candle */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-0.5 h-4" 
                    style={{ backgroundColor: profile.chart_colors.wick_up }}
                  />
                  <div 
                    className="w-6 h-10 rounded-sm"
                    style={{ 
                      backgroundColor: profile.chart_colors.body_up,
                      border: `2px solid ${profile.chart_colors.border_up}`
                    }}
                  />
                  <div 
                    className="w-0.5 h-2" 
                    style={{ backgroundColor: profile.chart_colors.wick_up }}
                  />
                </div>
                {/* Down candle */}
                <div className="flex flex-col items-center">
                  <div 
                    className="w-0.5 h-2" 
                    style={{ backgroundColor: profile.chart_colors.wick_down }}
                  />
                  <div 
                    className="w-6 h-10 rounded-sm"
                    style={{ 
                      backgroundColor: profile.chart_colors.body_down,
                      border: `2px solid ${profile.chart_colors.border_down}`
                    }}
                  />
                  <div 
                    className="w-0.5 h-4" 
                    style={{ backgroundColor: profile.chart_colors.wick_down }}
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  שומר...
                </>
              ) : (
                "שמור צבעים"
              )}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
