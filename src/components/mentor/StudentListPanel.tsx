import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { StudentWithProfile } from "@/hooks/useMentorRelationships";
import { Users, ChevronLeft, ChevronDown, ChevronUp, Clock, Check, X, Search, Sparkles, UserPlus } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredStudents = students.filter((student) => {
    const name = getDisplayName(student.student_profile);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const StudentList = () => (
    <div className="space-y-2">
      {filteredStudents.length === 0 ? (
        <div className="py-8 text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">לא נמצאו תלמידים</p>
        </div>
      ) : (
        filteredStudents.map((student) => {
          const displayName = getDisplayName(student.student_profile);
          const isSelected = selectedStudent?.id === student.id;
          
          return (
            <button
              key={student.id}
              onClick={() => handleSelectStudent(student)}
              className={`w-full p-3 rounded-2xl text-right transition-all duration-300 group ${
                isSelected
                  ? "bg-gradient-to-l from-primary/20 to-primary/5 border-2 border-primary shadow-lg shadow-primary/10"
                  : "hover:bg-muted/80 border-2 border-transparent hover:border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className={`h-12 w-12 shrink-0 transition-all duration-300 ${
                    isSelected 
                      ? 'ring-3 ring-primary ring-offset-2 ring-offset-background shadow-lg' 
                      : 'group-hover:ring-2 group-hover:ring-muted-foreground/20'
                  }`}>
                    <AvatarImage src={student.student_profile?.avatar_url || undefined} />
                    <AvatarFallback className={`font-bold text-sm ${
                      isSelected 
                        ? 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate transition-colors ${
                    isSelected ? 'text-primary' : 'text-foreground'
                  }`}>
                    {displayName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(student.created_at), 'dd/MM/yy', { locale: he })}
                    </p>
                  </div>
                </div>
                <ChevronLeft className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                  isSelected 
                    ? 'text-primary -translate-x-1' 
                    : 'text-muted-foreground/50 group-hover:text-muted-foreground group-hover:-translate-x-0.5'
                }`} />
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  const PendingRequestCard = ({ request }: { request: StudentWithProfile }) => {
    const displayName = getDisplayName(request.student_profile);
    return (
      <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-amber-500/20 hover:border-amber-500/40 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-10 w-10 border-2 border-amber-500/30 shrink-0">
            <AvatarImage src={request.student_profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-600 text-sm font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground">ממתין לאישור</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            className="h-9 px-4 bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success shadow-sm"
            onClick={() => onRespondToRequest(request.id, true)}
          >
            <Check className="h-4 w-4 ml-1" />
            אשר
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            onClick={() => onRespondToRequest(request.id, false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // Mobile collapsible version
  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Pending Requests Card */}
        {pendingRequests.length > 0 && (
          <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 shadow-inner">
                  <UserPlus className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">בקשות חדשות</h3>
                  <p className="text-xs text-muted-foreground">{pendingRequests.length} ממתינות לאישור</p>
                </div>
              </div>
              <div className="space-y-2">
                {pendingRequests.map((request) => (
                  <PendingRequestCard key={request.id} request={request} />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Collapsible Student List */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <Card className="bg-card border-border overflow-hidden">
            <CollapsibleTrigger asChild>
              <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">התלמידים שלי</span>
                    <Badge variant="secondary" className="mr-2 text-xs font-semibold">
                      {students.length}
                    </Badge>
                  </div>
                </div>
                <div className={`p-2 rounded-lg bg-muted transition-colors ${isOpen ? 'bg-primary/10' : ''}`}>
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-primary" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3">
                {students.length > 3 && (
                  <div className="relative mb-3">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חפש תלמיד..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 bg-muted/50 border-0 focus:bg-background"
                    />
                  </div>
                )}
                <div className="max-h-[350px] overflow-y-auto">
                  <StudentList />
                </div>
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
        <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/30 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 shadow-inner">
                <UserPlus className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">בקשות חדשות</h3>
                <p className="text-xs text-muted-foreground">{pendingRequests.length} ממתינות לאישור</p>
              </div>
              <Sparkles className="h-4 w-4 text-amber-500 mr-auto animate-pulse" />
            </div>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <PendingRequestCard key={request.id} request={request} />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Student List Card */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-gradient-to-l from-muted/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">התלמידים שלי</h3>
              <p className="text-xs text-muted-foreground">{students.length} תלמידים פעילים</p>
            </div>
          </div>
        </div>
        
        {students.length > 4 && (
          <div className="p-3 pb-0">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חפש תלמיד..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-muted/50 border-0 focus:bg-background transition-colors"
              />
            </div>
          </div>
        )}
        
        <ScrollArea className="h-[450px]">
          <div className="p-3">
            <StudentList />
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};