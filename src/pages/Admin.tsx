import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Users, TrendingUp, MessageSquare, Calendar, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfMonth } from "date-fns";
import { he } from "date-fns/locale";

interface UserStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalTrades: number;
  totalSharedPosts: number;
  totalComments: number;
}

interface UserProfile {
  user_id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  trade_count: number;
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    totalTrades: 0,
    totalSharedPosts: 0,
    totalComments: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      // Fetch statistics
      const weekAgo = subDays(new Date(), 7).toISOString();
      const monthStart = startOfMonth(new Date()).toISOString();

      const [
        profilesResult,
        newWeekResult,
        newMonthResult,
        tradesResult,
        sharedResult,
        commentsResult,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
        supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
        supabase.from("trades").select("*", { count: "exact", head: true }),
        supabase.from("shared_trades").select("*", { count: "exact", head: true }),
        supabase.from("shared_trade_comments").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalUsers: profilesResult.count || 0,
        newUsersThisWeek: newWeekResult.count || 0,
        newUsersThisMonth: newMonthResult.count || 0,
        totalTrades: tradesResult.count || 0,
        totalSharedPosts: sharedResult.count || 0,
        totalComments: commentsResult.count || 0,
      });

      // Fetch user list with trade counts
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, email, username, first_name, last_name, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (profilesData) {
        // Get trade counts for each user
        const usersWithTrades = await Promise.all(
          profilesData.map(async (profile) => {
            const { count } = await supabase
              .from("trades")
              .select("*", { count: "exact", head: true })
              .eq("user_id", profile.user_id);
            return { ...profile, trade_count: count || 0 };
          })
        );
        setUsers(usersWithTrades);
      }

      setLoading(false);
    };

    checkAdminAndFetchData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout title="ניהול">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout title="ניהול מערכת">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">סה"כ משתמשים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsersThisWeek} השבוע • +{stats.newUsersThisMonth} החודש
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">סה"כ עסקאות</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">
                ממוצע {stats.totalUsers > 0 ? (stats.totalTrades / stats.totalUsers).toFixed(1) : 0} לכל משתמש
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">פעילות קהילה</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSharedPosts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalComments} תגובות
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              משתמשים אחרונים (50)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">אימייל</TableHead>
                  <TableHead className="text-right">שם משתמש</TableHead>
                  <TableHead className="text-right">תאריך הצטרפות</TableHead>
                  <TableHead className="text-right">עסקאות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((profile) => (
                  <TableRow key={profile.user_id}>
                    <TableCell className="font-medium">
                      {profile.first_name && profile.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : "-"}
                    </TableCell>
                    <TableCell>{profile.email || "-"}</TableCell>
                    <TableCell>{profile.username || "-"}</TableCell>
                    <TableCell>
                      {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: he })}
                    </TableCell>
                    <TableCell>{profile.trade_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
