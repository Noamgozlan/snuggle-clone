import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudentWithProfile } from "@/hooks/useMentorRelationships";
import { Trash2 } from "lucide-react";
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
      <div className="h-16 md:h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
      <div className="px-4 md:px-6 pb-4 md:pb-6 -mt-8 md:-mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="flex items-end gap-3">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-card shadow-lg shrink-0">
              <AvatarImage src={student.student_profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="mb-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-foreground truncate">
                {displayName}
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground">
                תלמיד מ-{format(new Date(student.created_at), 'MMMM yyyy', { locale: he })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemoveStudent(student.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4 ml-1" />
            הסר
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mt-4 md:mt-6">
            <div className="bg-muted/50 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalTrades}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">סה"כ עסקאות</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 md:p-4 text-center">
              <p className={`text-xl md:text-2xl font-bold ${stats.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                {stats.winRate.toFixed(0)}%
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">אחוז הצלחה</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 md:p-4 text-center">
              <p className={`text-xl md:text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${stats.totalPnl.toFixed(0)}
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">סה"כ רווח</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 md:p-4 text-center">
              <p className="text-xl md:text-2xl font-bold text-foreground">{stats.avgRR.toFixed(1)}R</p>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">ממוצע RR</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
