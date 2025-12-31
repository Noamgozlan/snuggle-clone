import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Channel } from "@/hooks/useCommunity";

interface UserWithProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role?: string;
}

interface OnlineUsersListProps {
  channel: Channel | null;
}

const getRoleBadge = (role?: string) => {
  switch (role) {
    case "admin":
      return <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1">Admin</Badge>;
    case "moderator":
      return <Badge className="bg-blue-500/20 text-blue-400 text-[10px] px-1">Mod</Badge>;
    case "premium":
      return <Badge className="bg-yellow-500/20 text-yellow-400 text-[10px] px-1">Premium</Badge>;
    default:
      return null;
  }
};

export const OnlineUsersList = ({ channel }: OnlineUsersListProps) => {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch all users who have sent messages in this channel recently
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (!channel) return;

        const { data: messages, error: messagesError } = await supabase
          .from("community_messages")
          .select("user_id")
          .eq("channel_id", channel.id)
          .gte("created_at", thirtyDaysAgo.toISOString());

        if (messagesError) throw messagesError;

        const userIds = [...new Set(messages?.map((m) => m.user_id) || [])];

        if (userIds.length === 0) {
          setUsers([]);
          return;
        }

        // Fetch profiles and roles
        const [profilesResult, rolesResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, first_name, last_name, username, avatar_url")
            .in("user_id", userIds),
          supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
        ]);

        const rolesMap = new Map(rolesResult.data?.map((r) => [r.user_id, r.role]) || []);

        const usersWithRoles: UserWithProfile[] = (profilesResult.data || []).map((p) => ({
          ...p,
          role: rolesMap.get(p.user_id),
        }));

        // Sort by role priority
        usersWithRoles.sort((a, b) => {
          const priority: Record<string, number> = { admin: 0, moderator: 1, premium: 2 };
          const aPriority = priority[a.role || ""] ?? 3;
          const bPriority = priority[b.role || ""] ?? 3;
          return aPriority - bPriority;
        });

        setUsers(usersWithRoles);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [channel?.id]);

  const getDisplayName = (user: UserWithProfile) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    return user.username || "משתמש";
  };

  const getInitials = (user: UserWithProfile) => {
    if (user.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user.username) return user.username.charAt(0).toUpperCase();
    return "?";
  };

  if (!channel) return null;

  return (
    <div className="w-60 border-r border-border bg-card/30 flex flex-col">
      <div className="h-12 border-b border-border flex items-center px-4">
        <h3 className="font-semibold text-sm text-muted-foreground">
          משתמשים — {users.length}
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              אין משתמשים פעילים
            </p>
          ) : (
            users.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">{getDisplayName(user)}</span>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
