import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMentorRelationships } from "@/hooks/useMentorRelationships";
import { GraduationCap, UserPlus, X, Check, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const MentorSettings = () => {
  const {
    myMentor,
    pendingRequests,
    loading,
    sendMentorRequest,
    respondToRequest,
    removeMentor,
  } = useMentorRelationships();

  const [mentorUsername, setMentorUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorUsername.trim()) return;

    setIsSubmitting(true);
    const result = await sendMentorRequest(mentorUsername.trim());
    setIsSubmitting(false);

    if (result.success) {
      toast.success("בקשה נשלחה בהצלחה! ממתין לאישור המנטור");
      setMentorUsername("");
    } else {
      toast.error(result.error || "שגיאה בשליחת הבקשה");
    }
  };

  const handleRemoveMentor = async () => {
    const result = await removeMentor();
    if (result.success) {
      toast.success("המנטור הוסר בהצלחה");
    } else {
      toast.error("שגיאה בהסרת המנטור");
    }
  };

  const handleRespondToRequest = async (relationshipId: string, accept: boolean) => {
    const result = await respondToRequest(relationshipId, accept);
    if (result.success) {
      toast.success(accept ? "התלמיד התווסף בהצלחה" : "הבקשה נדחתה");
    } else {
      toast.error("שגיאה בטיפול בבקשה");
    }
  };

  const getDisplayName = (profile?: { first_name: string | null; last_name: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
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

  if (loading) {
    return (
      <Card className="bg-card border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* My Mentor Section */}
      <Card className="bg-card border-border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">המנטור שלי</h2>
            <p className="text-muted-foreground text-sm">
              הוסף מנטור שיוכל לצפות בעסקאות שלך ולתת לך משוב
            </p>
          </div>
        </div>

        {myMentor ? (
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={myMentor.mentor_profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getInitials(getDisplayName(myMentor.mentor_profile))}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {getDisplayName(myMentor.mentor_profile)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {myMentor.status === 'pending' ? (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      ממתין לאישור
                    </Badge>
                  ) : myMentor.status === 'accepted' ? (
                    <Badge variant="default" className="bg-success text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      מאושר
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <X className="h-3 w-3 mr-1" />
                      נדחה
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemoveMentor}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mentorUsername">שם משתמש של המנטור</Label>
              <div className="flex gap-2">
                <Input
                  id="mentorUsername"
                  type="text"
                  value={mentorUsername}
                  onChange={(e) => setMentorUsername(e.target.value)}
                  placeholder="username"
                  dir="ltr"
                  className="text-left"
                />
                <Button type="submit" disabled={isSubmitting || !mentorUsername.trim()}>
                  <UserPlus className="h-4 w-4 ml-2" />
                  שלח בקשה
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>

      {/* Pending Requests (for mentors) */}
      {pendingRequests.length > 0 && (
        <Card className="bg-card border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            בקשות ממתינות ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={request.student_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {getInitials(getDisplayName(request.student_profile))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {getDisplayName(request.student_profile)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.student_profile?.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRespondToRequest(request.id, true)}
                    className="bg-success hover:bg-success/90"
                  >
                    <Check className="h-4 w-4 ml-1" />
                    אשר
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespondToRequest(request.id, false)}
                  >
                    <X className="h-4 w-4 ml-1" />
                    דחה
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
