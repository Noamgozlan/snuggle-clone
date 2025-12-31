import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { 
  Users, TrendingUp, MessageSquare, Calendar, Loader2, 
  Shield, Trash2, Eye, Search, UserPlus, Ban, 
  MoreHorizontal, RefreshCw, Download, AlertTriangle,
  CheckCircle, XCircle, Crown, UserX
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, subDays, startOfMonth, subMonths } from "date-fns";
import { he } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalTrades: number;
  totalSharedPosts: number;
  totalComments: number;
  totalLikes: number;
  totalStrategies: number;
  totalPortfolios: number;
}

interface UserProfile {
  user_id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  is_public: boolean;
  trade_count: number;
  roles: string[];
}

interface SharedPost {
  id: string;
  user_id: string;
  symbol: string;
  trade_type: string;
  pnl: number | null;
  notes: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  username: string | null;
}

interface UserDetailsData {
  profile: UserProfile;
  trades: any[];
  portfolios: any[];
  strategies: any[];
}

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    newUsersThisWeek: 0,
    newUsersThisMonth: 0,
    totalTrades: 0,
    totalSharedPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    totalStrategies: 0,
    totalPortfolios: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sharedPosts, setSharedPosts] = useState<SharedPost[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetailsData | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deletePostOpen, setDeletePostOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<SharedPost | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [userForRole, setUserForRole] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loadingAction, setLoadingAction] = useState(false);

  const fetchData = async () => {
    if (!user) return;

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
      likesResult,
      strategiesResult,
      portfoliosResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
      supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", monthStart),
      supabase.from("trades").select("*", { count: "exact", head: true }),
      supabase.from("shared_trades").select("*", { count: "exact", head: true }),
      supabase.from("shared_trade_comments").select("*", { count: "exact", head: true }),
      supabase.from("shared_trade_likes").select("*", { count: "exact", head: true }),
      supabase.from("strategies").select("*", { count: "exact", head: true }),
      supabase.from("portfolios").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      totalUsers: profilesResult.count || 0,
      newUsersThisWeek: newWeekResult.count || 0,
      newUsersThisMonth: newMonthResult.count || 0,
      totalTrades: tradesResult.count || 0,
      totalSharedPosts: sharedResult.count || 0,
      totalComments: commentsResult.count || 0,
      totalLikes: likesResult.count || 0,
      totalStrategies: strategiesResult.count || 0,
      totalPortfolios: portfoliosResult.count || 0,
    });

    // Fetch user list with trade counts and roles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, email, username, first_name, last_name, created_at, is_public")
      .order("created_at", { ascending: false })
      .limit(100);

    if (profilesData) {
      const usersWithDetails = await Promise.all(
        profilesData.map(async (profile) => {
          const [tradeResult, rolesResult] = await Promise.all([
            supabase.from("trades").select("*", { count: "exact", head: true }).eq("user_id", profile.user_id),
            supabase.from("user_roles").select("role").eq("user_id", profile.user_id),
          ]);
          return { 
            ...profile, 
            trade_count: tradeResult.count || 0,
            roles: rolesResult.data?.map(r => r.role) || []
          };
        })
      );
      setUsers(usersWithDetails);
    }

    // Fetch shared posts
    const { data: postsData } = await supabase
      .from("shared_trades")
      .select("id, user_id, symbol, trade_type, pnl, notes, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsData) {
      const postsWithDetails = await Promise.all(
        postsData.map(async (post) => {
          const [likesResult, commentsResult, profileResult] = await Promise.all([
            supabase.from("shared_trade_likes").select("*", { count: "exact", head: true }).eq("shared_trade_id", post.id),
            supabase.from("shared_trade_comments").select("*", { count: "exact", head: true }).eq("shared_trade_id", post.id),
            supabase.from("profiles").select("username").eq("user_id", post.user_id).maybeSingle(),
          ]);
          return {
            ...post,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            username: profileResult.data?.username || null,
          };
        })
      );
      setSharedPosts(postsWithDetails);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("הנתונים עודכנו");
  };

  const viewUserDetails = async (profile: UserProfile) => {
    setLoadingAction(true);
    
    const [tradesResult, portfoliosResult, strategiesResult] = await Promise.all([
      supabase.from("trades").select("*").eq("user_id", profile.user_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("portfolios").select("*").eq("user_id", profile.user_id),
      supabase.from("strategies").select("*").eq("user_id", profile.user_id),
    ]);

    setSelectedUser({
      profile,
      trades: tradesResult.data || [],
      portfolios: portfoliosResult.data || [],
      strategies: strategiesResult.data || [],
    });
    setUserDetailsOpen(true);
    setLoadingAction(false);
  };

  const handleAddRole = async () => {
    if (!userForRole || !selectedRole) return;
    
    setLoadingAction(true);
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userForRole.user_id, role: selectedRole as "admin" | "moderator" | "user" });
    
    if (error) {
      if (error.code === "23505") {
        toast.error("למשתמש כבר יש את התפקיד הזה");
      } else {
        toast.error("שגיאה בהוספת התפקיד");
      }
    } else {
      toast.success("התפקיד נוסף בהצלחה");
      await fetchData();
    }
    
    setRoleDialogOpen(false);
    setUserForRole(null);
    setSelectedRole("");
    setLoadingAction(false);
  };

  const handleRemoveRole = async (userId: string, role: string) => {
    setLoadingAction(true);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role as "admin" | "moderator" | "user");
    
    if (error) {
      toast.error("שגיאה בהסרת התפקיד");
    } else {
      toast.success("התפקיד הוסר בהצלחה");
      await fetchData();
    }
    setLoadingAction(false);
  };

  const handleDeletePost = async () => {
    if (!postToDelete) return;
    
    setLoadingAction(true);
    const { error } = await supabase
      .from("shared_trades")
      .delete()
      .eq("id", postToDelete.id);
    
    if (error) {
      toast.error("שגיאה במחיקת הפוסט");
    } else {
      toast.success("הפוסט נמחק בהצלחה");
      setSharedPosts(posts => posts.filter(p => p.id !== postToDelete.id));
    }
    
    setDeletePostOpen(false);
    setPostToDelete(null);
    setLoadingAction(false);
  };

  const exportUsersCSV = () => {
    const headers = ["שם", "אימייל", "שם משתמש", "תאריך הצטרפות", "עסקאות", "תפקידים"];
    const rows = users.map(u => [
      `${u.first_name || ""} ${u.last_name || ""}`.trim() || "-",
      u.email || "-",
      u.username || "-",
      format(new Date(u.created_at), "dd/MM/yyyy"),
      u.trade_count.toString(),
      u.roles.join(", ") || "user"
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.click();
    toast.success("הקובץ הורד בהצלחה");
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query) ||
      u.first_name?.toLowerCase().includes(query) ||
      u.last_name?.toLowerCase().includes(query)
    );
  });

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
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">לוח בקרה</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportUsersCSV}>
              <Download className="h-4 w-4 ml-2" />
              ייצוא CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ml-2 ${refreshing ? "animate-spin" : ""}`} />
              רענן
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">משתמשים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newUsersThisWeek} השבוע
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">עסקאות</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalUsers > 0 ? (stats.totalTrades / stats.totalUsers).toFixed(1) : 0} ממוצע
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">פוסטים</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSharedPosts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalComments} תגובות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">לייקים</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
              <p className="text-xs text-muted-foreground">
                אינטראקציות
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">אסטרטגיות</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStrategies}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPortfolios} תיקים
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="users">משתמשים</TabsTrigger>
            <TabsTrigger value="posts">פוסטים בקהילה</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש משתמש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Badge variant="secondary">{filteredUsers.length} משתמשים</Badge>
            </div>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם</TableHead>
                      <TableHead className="text-right">אימייל</TableHead>
                      <TableHead className="text-right">שם משתמש</TableHead>
                      <TableHead className="text-right">תאריך הצטרפות</TableHead>
                      <TableHead className="text-right">עסקאות</TableHead>
                      <TableHead className="text-right">תפקידים</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((profile) => (
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
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {profile.roles.length > 0 ? (
                              profile.roles.map((role) => (
                                <Badge 
                                  key={role} 
                                  variant={role === "admin" ? "default" : "secondary"}
                                  className="flex items-center gap-1"
                                >
                                  {role === "admin" && <Crown className="h-3 w-3" />}
                                  {role}
                                  {profile.user_id !== user?.id && (
                                    <button 
                                      onClick={() => handleRemoveRole(profile.user_id, role)}
                                      className="mr-1 hover:text-destructive"
                                      disabled={loadingAction}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </button>
                                  )}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">user</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => viewUserDetails(profile)}>
                                <Eye className="h-4 w-4 ml-2" />
                                צפה בפרטים
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setUserForRole(profile);
                                setRoleDialogOpen(true);
                              }}>
                                <UserPlus className="h-4 w-4 ml-2" />
                                הוסף תפקיד
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>פוסטים אחרונים</CardTitle>
                <CardDescription>ניהול פוסטים בקהילה</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">משתמש</TableHead>
                      <TableHead className="text-right">סימול</TableHead>
                      <TableHead className="text-right">סוג</TableHead>
                      <TableHead className="text-right">רווח/הפסד</TableHead>
                      <TableHead className="text-right">תאריך</TableHead>
                      <TableHead className="text-right">לייקים</TableHead>
                      <TableHead className="text-right">תגובות</TableHead>
                      <TableHead className="text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharedPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          {post.username || "-"}
                        </TableCell>
                        <TableCell>{post.symbol}</TableCell>
                        <TableCell>
                          <Badge variant={post.trade_type === "long" ? "default" : "secondary"}>
                            {post.trade_type}
                          </Badge>
                        </TableCell>
                        <TableCell className={post.pnl && post.pnl > 0 ? "text-green-500" : "text-red-500"}>
                          {post.pnl ? `$${post.pnl.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(post.created_at), "dd/MM/yyyy", { locale: he })}
                        </TableCell>
                        <TableCell>{post.likes_count}</TableCell>
                        <TableCell>{post.comments_count}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setPostToDelete(post);
                              setDeletePostOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>פרטי משתמש</DialogTitle>
            <DialogDescription>
              {selectedUser?.profile.email}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedUser && (
              <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">שם מלא</label>
                    <p className="font-medium">
                      {selectedUser.profile.first_name} {selectedUser.profile.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">שם משתמש</label>
                    <p className="font-medium">{selectedUser.profile.username || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">פרופיל ציבורי</label>
                    <p className="font-medium">{selectedUser.profile.is_public ? "כן" : "לא"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">תאריך הצטרפות</label>
                    <p className="font-medium">
                      {format(new Date(selectedUser.profile.created_at), "dd/MM/yyyy HH:mm", { locale: he })}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">תיקים ({selectedUser.portfolios.length})</h4>
                  {selectedUser.portfolios.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.portfolios.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">${p.balance?.toFixed(2) || 0}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">אין תיקים</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">אסטרטגיות ({selectedUser.strategies.length})</h4>
                  {selectedUser.strategies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.strategies.map((s: any) => (
                        <Badge key={s.id} variant="outline">{s.name}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">אין אסטרטגיות</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">עסקאות אחרונות ({selectedUser.trades.length})</h4>
                  {selectedUser.trades.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">סימול</TableHead>
                          <TableHead className="text-right">סוג</TableHead>
                          <TableHead className="text-right">רווח/הפסד</TableHead>
                          <TableHead className="text-right">תאריך</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.trades.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.symbol}</TableCell>
                            <TableCell>{t.trade_type}</TableCell>
                            <TableCell className={t.pnl > 0 ? "text-green-500" : "text-red-500"}>
                              {t.pnl ? `$${t.pnl.toFixed(2)}` : "-"}
                            </TableCell>
                            <TableCell>
                              {t.entry_date ? format(new Date(t.entry_date), "dd/MM/yyyy") : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-sm">אין עסקאות</p>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף תפקיד</DialogTitle>
            <DialogDescription>
              הוסף תפקיד למשתמש {userForRole?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleAddRole} disabled={!selectedRole || loadingAction}>
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "הוסף"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={deletePostOpen} onOpenChange={setDeletePostOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פוסט</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הפוסט הזה? פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePost} className="bg-destructive text-destructive-foreground">
              {loadingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : "מחק"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
