import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StudentWithProfile } from "@/hooks/useMentorRelationships";
import { Users, ChevronLeft, ChevronDown, ChevronUp, Clock, Check, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface StudentListPanelProps {
  students: StudentWithProfile[];
  pendingRequests: StudentWithProfile[];
  selectedStudent: StudentWithProfile | null;
  onSelectStudent: (student: StudentWithProfile) => void;
  onRespondToRequest: (relationshipId: string, accept: boolean) => Promise<{ success: boolean }>;
}

export const StudentListPanel = ({
  students,
  pendingRequests,
  selectedStudent,
  onSelectStudent,
  onRespondToRequest,
}: StudentListPanelProps) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

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

  const handleSelectStudent = (student: StudentWithProfile) => {
    onSelectStudent(student);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const StudentList = () => (
    <div className="space-y-1">
      {students.map((student) => {
        const displayName = getDisplayName(student.student_profile);
        const isSelected = selectedStudent?.id === student.id;
        
        return (
          <button
            key={student.id}
            onClick={() => handleSelectStudent(student)}
            className={`w-full p-3 rounded-xl text-right transition-all ${
              isSelected
                ? "bg-primary/10 border-2 border-primary shadow-sm"
                : "hover:bg-muted border-2 border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <Avatar className={`h-11 w-11 shrink-0 ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                <AvatarImage src={student.student_profile?.avatar_url || undefined} />
                <AvatarFallback className={`font-semibold ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'}`}>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  הצטרף {format(new Date(student.created_at), 'dd/MM', { locale: he })}
                </p>
              </div>
              <ChevronLeft className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-primary -translate-x-1' : 'text-muted-foreground'}`} />
            </div>
          </button>
        );
      })}
    </div>
  );

  // Mobile collapsible version
  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Pending Requests Card */}
        {pendingRequests.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground text-sm">
                בקשות ממתינות ({pendingRequests.length})
              </h3>
            </div>
            <div className="space-y-2">
              {pendingRequests.map((request) => {
                const displayName = getDisplayName(request.student_profile);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-card/50 backdrop-blur rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-9 w-9 border border-amber-500/30 shrink-0">
                        <AvatarImage src={request.student_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-600 text-xs font-semibold">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-foreground text-sm truncate">{displayName}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        className="h-8 w-8 bg-success hover:bg-success/90"
                        onClick={() => onRespondToRequest(request.id, true)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                        onClick={() => onRespondToRequest(request.id, false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Collapsible Student List */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card className="bg-card border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">התלמידים שלי</span>
                  <Badge variant="secondary" className="text-xs">
                    {students.length}
                  </Badge>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 pb-2 max-h-[300px] overflow-y-auto">
                <StudentList />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="space-y-4">
      {/* Pending Requests Card - Desktop */}
      {pendingRequests.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">
              בקשות ממתינות ({pendingRequests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((request) => {
              const displayName = getDisplayName(request.student_profile);
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-card/50 backdrop-blur rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-9 w-9 border border-amber-500/30 shrink-0">
                      <AvatarImage src={request.student_profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-amber-500/20 text-amber-600 text-xs font-semibold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-foreground text-sm truncate">{displayName}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-success hover:bg-success/90"
                      onClick={() => onRespondToRequest(request.id, true)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                      onClick={() => onRespondToRequest(request.id, false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Student List Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            התלמידים שלי
          </h3>
        </div>
        <ScrollArea className="h-[500px]">
          <div className="p-2">
            <StudentList />
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
