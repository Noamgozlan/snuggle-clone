import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ChartColors {
  body_up: string;
  body_down: string;
  border_up: string;
  border_down: string;
  wick_up: string;
  wick_down: string;
  background: string;
}

interface Profile {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  favorite_asset: string | null;
  is_public: boolean;
  chart_colors: ChartColors;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<boolean>;
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

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, username, email, avatar_url, favorite_asset, is_public, chart_colors")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const rawChartColors = data.chart_colors as Record<string, string> | null;
        const chartColors: ChartColors = rawChartColors ? {
          body_up: rawChartColors.body_up || defaultChartColors.body_up,
          body_down: rawChartColors.body_down || defaultChartColors.body_down,
          border_up: rawChartColors.border_up || defaultChartColors.border_up,
          border_down: rawChartColors.border_down || defaultChartColors.border_down,
          wick_up: rawChartColors.wick_up || defaultChartColors.wick_up,
          wick_down: rawChartColors.wick_down || defaultChartColors.wick_down,
          background: rawChartColors.background || defaultChartColors.background,
        } : defaultChartColors;

        setProfile({
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
          email: data.email || user.email,
          avatar_url: data.avatar_url,
          favorite_asset: data.favorite_asset,
          is_public: data.is_public ?? false,
          chart_colors: chartColors,
        });
      } else {
        setProfile({
          first_name: null,
          last_name: null,
          username: null,
          email: user.email || null,
          avatar_url: null,
          favorite_asset: null,
          is_public: false,
          chart_colors: defaultChartColors,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const updateProfile = async (updates: Partial<Profile>): Promise<boolean> => {
    if (!user) return false;

    try {
      // Convert chart_colors to a plain object for Supabase
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.chart_colors) {
        dbUpdates.chart_colors = { ...updates.chart_colors };
      }

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(dbUpdates)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new profile with user_id
        const { error } = await supabase
          .from("profiles")
          .insert({ 
            user_id: user.id, 
            email: user.email,
            ...dbUpdates 
          });

        if (error) throw error;
      }

      // Update local state immediately
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};

export type { ChartColors, Profile };
