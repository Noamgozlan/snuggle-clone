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
  MessageCircle,
  Target,
  GraduationCap,
  Shield,
  MessageSquare,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMentorRelationships } from "@/hooks/useMentorRelationships";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

const menuItemDefs = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", href: "/dashboard" },
  { icon: TrendingUp, labelKey: "nav.trades", href: "/trades" },
  { icon: BarChart3, labelKey: "nav.statistics", href: "/statistics" },
  { icon: Target, labelKey: "nav.strategies", href: "/strategies" },
  { icon: TrendingUp, labelKey: "nav.backtesting", href: "/backtesting" },
  { icon: Users, labelKey: "nav.community", href: "/community" },
  { icon: Gift, labelKey: "nav.giveaways", href: "/giveaways" },
];

const bottomMenuItemDefs = [
  { icon: User, labelKey: "nav.profile", href: "/profile" },
  { icon: Settings, labelKey: "nav.settings", href: "/settings" },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export const DashboardSidebar = ({ onNavigate }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { t } = useLanguage();
  const { myMentor, myStudents, pendingRequests } = useMentorRelationships();
  const [isAdmin, setIsAdmin] = useState(false);

  const menuItems = menuItemDefs.map(item => ({ ...item, label: t(item.labelKey) }));
  const bottomMenuItems = bottomMenuItemDefs.map(item => ({ ...item, label: t(item.labelKey) }));

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
      : profile?.username || user?.email?.split("@")[0] || "";

  const displayEmail = profile?.email || user?.email || "";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const renderNavItem = (item: { icon: any; label: string; href: string }, badge?: number) => {
    const isActive = location.pathname === item.href;
    return (
      <li key={item.href}>
        <Link
          to={item.href}
          onClick={handleLinkClick}
          className={cn(
            "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
          )}
        >
          <item.icon className={cn(
            "h-[18px] w-[18px] transition-colors",
            isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          )} />
          <span className="truncate">{item.label}</span>
          {badge && badge > 0 && (
            <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
              {badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside className="h-svh w-[85vw] max-w-[280px] md:w-64 bg-sidebar flex flex-col border-s border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center">
        <Link to="/" className="flex items-center gap-2" onClick={handleLinkClick}>
          <Logo size="md" />
        </Link>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User Profile */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-3">{t("nav.navigation")}</p>
        <ul className="space-y-0.5">
          {menuItems.map((item) => renderNavItem(item))}

          {hasApprovedMentor && renderNavItem({ icon: MessageSquare, label: t("nav.mentorChat"), href: "/mentor-chat" })}
          {hasMentorAccess && renderNavItem(
            { icon: GraduationCap, label: t("nav.mentor"), href: "/mentor" },
            pendingRequests.length
          )}
          {isAdmin && renderNavItem({ icon: Shield, label: t("nav.admin"), href: "/admin" })}
        </ul>

        <Separator className="bg-sidebar-border my-3" />
        
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2 px-3">חשבון</p>
        <ul className="space-y-0.5">
          {bottomMenuItems.map((item) => renderNavItem(item))}
        </ul>
      </nav>

      {/* Social Links & Sign Out */}
      <div className="px-3 pb-3 space-y-2">
        <Separator className="bg-sidebar-border" />
        <div className="flex justify-center gap-1 py-2">
          <a href="https://chat.whatsapp.com/CACIhgk6ZtP07rXb41vFtg" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 text-muted-foreground hover:text-success hover:bg-success/10">
              <MessageCircle className="h-4 w-4" />
            </Button>
          </a>
          <a href="https://www.instagram.com/tradergoz/" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </Button>
          </a>
          <a href="https://discord.gg/j2WwxwvSFY" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.369A19.791 19.791 0 0016.726 3c-.183.33-.391.8-.537 1.157a17.455 17.455 0 00-4.374 0A12.263 12.263 0 0011.274 3 19.791 19.791 0 007.683 4.369c-2.2 3.217-2.796 6.361-2.494 9.457 1.464 1.84 3.49 2.646 5.549 2.887.421-.582.8-1.2 1.126-1.852a9.506 9.506 0 01-1.57-.598c.135-.1.267-.206.395-.314 3.024 1.418 6.291 1.418 9.315 0 .13.108.262.212.395.314-.5.196-1.02.373-1.57.598.326.648.705 1.266 1.126 1.847 2.062-.24 4.089-1.05 5.559-2.887.326-3.204-.342-6.337-2.387-9.457zM9.059 12.915c-1.094 0-1.992-.998-1.992-2.225s.884-2.225 1.992-2.225 1.992.998 1.992 2.225-.884 2.225-1.992 2.225zm5.882 0c-1.094 0-1.992-.998-1.992-2.225s.884-2.225 1.992-2.225 1.992.998 1.992 2.225-.884 2.225-1.992 2.225z" />
              </svg>
            </Button>
          </a>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
          onClick={handleSignOut}
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("nav.logout")}
        </Button>
      </div>
    </aside>
  );
};
