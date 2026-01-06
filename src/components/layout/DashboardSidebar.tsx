import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Users,
  Gift,
  User,
  Settings,
  LogOut,
  MessageCircle,
  Target,
  GraduationCap,
  Shield,
  MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useMentorRelationships } from "@/hooks/useMentorRelationships";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  { icon: LayoutDashboard, label: "דף ראשי", href: "/dashboard" },
  { icon: TrendingUp, label: "עסקאות", href: "/trades" },
  { icon: BarChart3, label: "סטטיסטיקות", href: "/statistics" },
  { icon: Target, label: "אסטרטגיות", href: "/strategies" },
  { icon: BarChart3, label: "בקטסטינג", href: "/backtesting" },
  { icon: Users, label: "קהילה", href: "/community" },
  { icon: Gift, label: "הגרלות", href: "/giveaways" },
  { icon: User, label: "פרופיל", href: "/profile" },
  { icon: Settings, label: "הגדרות", href: "/settings" },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export const DashboardSidebar = ({ onNavigate }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { myMentor, myStudents, pendingRequests } = useMentorRelationships();
  const [isAdmin, setIsAdmin] = useState(false);

  const hasMentorAccess = myStudents.length > 0 || pendingRequests.length > 0;
  const hasApprovedMentor = myMentor?.status === "accepted";

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const handleLinkClick = () => {
    onNavigate?.();
  };

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.username || user?.email?.split("@")[0] || "משתמש";

  const displayEmail = profile?.email || user?.email || "";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="h-svh w-[85vw] max-w-xs md:w-64 bg-sidebar border-l border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Logo size="md" />
        </Link>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/20 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <p className="text-xs text-muted-foreground mb-3 px-3">תפריט ראשי</p>
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}

          {hasApprovedMentor && (
            <li>
              <Link
                to="/mentor-chat"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  location.pathname === "/mentor-chat"
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <MessageSquare className="h-5 w-5" />
                <span>צ'אט עם המנטור</span>
              </Link>
            </li>
          )}

          {hasMentorAccess && (
            <li>
              <Link
                to="/mentor"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  location.pathname === "/mentor"
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <GraduationCap className="h-5 w-5" />
                <span>לוח מנטור</span>
                {pendingRequests.length > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </Link>
            </li>
          )}

          {isAdmin && (
            <li>
              <Link
                to="/admin"
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  location.pathname === "/admin"
                    ? "bg-primary/10 text-primary border-r-2 border-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Shield className="h-5 w-5" />
                <span>ניהול מערכת</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border hidden sm:block">
        <p className="text-xs text-muted-foreground mb-3 text-center hidden lg:block">
          רוצים לקבל עדכונים שוטפים וטיפים ישירות אליכם? הצטרפו אלינו ותהיו חלק מקהילה חכמה!
        </p>
        <div className="flex justify-center gap-3">
          <a href="https://chat.whatsapp.com/CACIhgk6ZtP07rXb41vFtg" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-success" />
            </Button>
          </a>
          <a href="https://www.instagram.com/tradergoz/" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <svg className="h-4 w-4 md:h-5 md:w-5 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Button>
          </a>
          <a href="https://discord.gg/j2WwxwvSFY" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
              <svg className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.369A19.791 19.791 0 0016.726 3c-.183.33-.391.8-.537 1.157a17.455 17.455 0 00-4.374 0A12.263 12.263 0 0011.274 3 19.791 19.791 0 007.683 4.369c-2.2 3.217-2.796 6.361-2.494 9.457 1.464 1.84 3.49 2.646 5.549 2.887.421-.582.8-1.2 1.126-1.852a9.506 9.506 0 01-1.57-.598c.135-.1.267-.206.395-.314 3.024 1.418 6.291 1.418 9.315 0 .13.108.262.212.395.314-.5.196-1.02.373-1.57.598.326.648.705 1.266 1.126 1.847 2.062-.24 4.089-1.05 5.559-2.887.326-3.204-.342-6.337-2.387-9.457zM9.059 12.915c-1.094 0-1.992-.998-1.992-2.225s.884-2.225 1.992-2.225 1.992.998 1.992 2.225-.884 2.225-1.992 2.225zm5.882 0c-1.094 0-1.992-.998-1.992-2.225s.884-2.225 1.992-2.225 1.992.998 1.992 2.225-.884 2.225-1.992 2.225z" />
              </svg>
            </Button>
          </a>
        </div>
      </div>
    </aside>
  );
};
