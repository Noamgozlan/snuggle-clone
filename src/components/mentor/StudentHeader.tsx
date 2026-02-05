import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentWithProfile } from "@/hooks/useMentorRelationships";
import { Trash2, TrendingUp, TrendingDown, Target, BarChart3, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface StudentStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
}

interface StudentHeaderProps {
  student: StudentWithProfile;
  stats: StudentStats | null;
  onRemoveStudent: (relationshipId: string) => void;
}

export const StudentHeader = ({ student, stats, onRemoveStudent }: StudentHeaderProps) => {
  const getDisplayName = (profile?: { first_name: string | null; last_name: string | null; username: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.username) {
      return profile.username;
    }
    return profile?.email || "משתמש";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = getDisplayName(student.student_profile);

  return (
    <Card className="bg-card border-border overflow-hidden">
      {/* Hero gradient background */}
      <div className="h-24 md:h-28 bg-gradient-to-r from-primary/30 via-primary/15 to-primary/5 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent" />
      </div>
      
      <div className="px-4 md:px-6 pb-5 md:pb-6 -mt-14 md:-mt-16 relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-card shadow-xl shrink-0 ring-4 ring-primary/20">
                <AvatarImage src={student.student_profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-2xl md:text-3xl font-bold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-3 border-card flex items-center justify-center shadow-lg">
                <div className="w-2.5 h-2.5 bg-white rounded-full" />
              </div>
            </div>
            <div className="mb-2 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-foreground truncate">
                {displayName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  תלמיד מ-{format(new Date(student.created_at), 'MMMM yyyy', { locale: he })}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveStudent(student.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4 ml-1" />
            הסר תלמיד
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="relative overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40 rounded-2xl p-4 text-center border border-border/50">
              <div className="absolute top-2 left-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground/30" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-foreground">{stats.totalTrades}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">סה"כ עסקאות</p>
            </div>
            
            <div className={`relative overflow-hidden rounded-2xl p-4 text-center border ${
              stats.winRate >= 50 
                ? 'bg-gradient-to-br from-success/20 to-success/5 border-success/30' 
                : 'bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30'
            }`}>
              <div className="absolute top-2 left-2">
                <Target className="h-4 w-4 text-current opacity-30" />
              </div>
              <p className={`text-3xl md:text-4xl font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                {stats.winRate.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">אחוז הצלחה</p>
            </div>
            
            <div className={`relative overflow-hidden rounded-2xl p-4 text-center border ${
              stats.totalPnl >= 0 
                ? 'bg-gradient-to-br from-success/20 to-success/5 border-success/30' 
                : 'bg-gradient-to-br from-destructive/20 to-destructive/5 border-destructive/30'
            }`}>
              <div className="absolute top-2 left-2">
                {stats.totalPnl >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success/30" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive/30" />
                )}
              </div>
              <p className={`text-3xl md:text-4xl font-bold ${stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.totalPnl >= 0 ? '+' : ''}${Math.abs(stats.totalPnl).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">סה"כ רווח</p>
            </div>
            
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl p-4 text-center border border-primary/20">
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  RR
                </Badge>
              </div>
              <p className="text-3xl md:text-4xl font-bold text-primary">{stats.avgRR.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">ממוצע R:R</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};