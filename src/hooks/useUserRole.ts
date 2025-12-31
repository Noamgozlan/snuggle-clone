import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "moderator" | "user";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          setRole("user");
          setIsAdmin(false);
          setIsModerator(false);
        } else if (data) {
          const userRole = data.role as AppRole;
          setRole(userRole);
          setIsAdmin(userRole === "admin");
          setIsModerator(userRole === "moderator" || userRole === "admin");
        } else {
          // No role found, default to user
          setRole("user");
          setIsAdmin(false);
          setIsModerator(false);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole("user");
        setIsAdmin(false);
        setIsModerator(false);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  return { role, isAdmin, isModerator, loading };
};
