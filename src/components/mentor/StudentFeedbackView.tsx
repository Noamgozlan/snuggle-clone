import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMentorFeedback } from "@/hooks/useMentorFeedback";
import { useMentorRelationships } from "@/hooks/useMentorRelationships";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, FileText, GraduationCap, Calendar, Send, Reply } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface FeedbackReply {
  id: string;
  feedback_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export const StudentFeedbackView = () => {
  const { user } = useAuth();
  const { myMentor } = useMentorRelationships();
  const { tradeFeedback, mentorNotes, loading, refreshFeedback } = useMentorFeedback();
  const { toast } = useToast();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<FeedbackReply[]>([]);
  const [submittingReply, setSubmittingReply] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  // Fetch replies for all feedback
  useEffect(() => {
    const fetchReplies = async () => {
      if (tradeFeedback.length === 0) return;

      const feedbackIds = tradeFeedback.map(f => f.id);
      const { data, error } = await supabase
        .from('feedback_replies')
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setReplies(data);
      }
    };

    fetchReplies();
  }, [tradeFeedback]);

  // Listen for realtime feedback updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('mentor-feedback-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentor_trade_feedback',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New trade feedback received:', payload);
          playNotificationSound();
          toast({
            title: "משוב חדש מהמנטור! 📝",
            description: "המנטור שלך נתן לך משוב חדש על עסקה",
          });
          refreshFeedback();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentor_notes',
          filter: `student_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New mentor note received:', payload);
          playNotificationSound();
          toast({
            title: "הערה חדשה מהמנטור! 📋",
            description: "המנטור שלך הוסיף הערה כללית חדשה",
          });
          refreshFeedback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshFeedback, toast]);

  const handleSubmitReply = async (feedbackId: string) => {
    if (!user || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const { error } = await supabase
        .from('feedback_replies')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
          content: replyContent.trim(),
        });

      if (error) throw error;

      // Refresh replies
      const { data } = await supabase
        .from('feedback_replies')
        .select('*')
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true });

      if (data) {
        setReplies(prev => [...prev.filter(r => r.feedback_id !== feedbackId), ...data]);
      }

      toast({
        title: "התגובה נשלחה!",
        description: "המנטור יקבל את התגובה שלך",
      });

      setReplyContent("");
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח את התגובה",
        variant: "destructive",
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const getDisplayName = (profile?: { first_name: string | null; last_name: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return profile?.email || "מנטור";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRepliesForFeedback = (feedbackId: string) => {
    return replies.filter(r => r.feedback_id === feedbackId);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  // Only show if student has an accepted mentor
  if (!myMentor || myMentor.status !== 'accepted') {
    return null;
  }

  const hasFeedback = tradeFeedback.length > 0 || mentorNotes.length > 0;

  return (
    <Card className="bg-card border-border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">משובים מהמנטור</h2>
          <p className="text-muted-foreground text-sm">
            צפה במשובים והערות שקיבלת מ{getDisplayName(myMentor.mentor_profile)}
          </p>
        </div>
      </div>

      {/* Mentor Info */}
      <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-lg mb-6">
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
          <p className="text-sm text-muted-foreground">המנטור שלך</p>
        </div>
      </div>

      {!hasFeedback ? (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>עדיין אין משובים מהמנטור</p>
          <p className="text-sm mt-1">המנטור שלך יוכל לכתוב לך משובים על העסקאות והתקדמותך</p>
        </div>
      ) : (
        <Tabs defaultValue="feedback" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              משוב על עסקאות ({tradeFeedback.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              הערות כלליות ({mentorNotes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feedback" className="mt-4">
            {tradeFeedback.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>עדיין אין משובים על עסקאות</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {tradeFeedback.map((feedback) => {
                  const feedbackReplies = getRepliesForFeedback(feedback.id);
                  const isReplying = replyingTo === feedback.id;

                  return (
                    <div
                      key={feedback.id}
                      className="p-4 bg-secondary/30 rounded-lg border-r-4 border-primary"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {feedback.trade_id ? "משוב על עסקה" : "משוב כללי"}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                        </div>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{feedback.content}</p>

                      {/* Replies */}
                      {feedbackReplies.length > 0 && (
                        <div className="mt-3 space-y-2 pr-4 border-r-2 border-border">
                          {feedbackReplies.map((reply) => (
                            <div key={reply.id} className="bg-background/50 p-3 rounded-lg">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                <Reply className="h-3 w-3" />
                                <span>התגובה שלך</span>
                                <span>•</span>
                                <span>{format(new Date(reply.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                              </div>
                              <p className="text-sm text-foreground">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      {isReplying ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="כתוב תגובה למנטור..."
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                            >
                              ביטול
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(feedback.id)}
                              disabled={!replyContent.trim() || submittingReply}
                            >
                              <Send className="h-4 w-4 ml-1" />
                              שלח
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3"
                          onClick={() => setReplyingTo(feedback.id)}
                        >
                          <Reply className="h-4 w-4 ml-1" />
                          השב
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            {mentorNotes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>עדיין אין הערות כלליות</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {mentorNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 bg-secondary/30 rounded-lg border-r-4 border-accent"
                  >
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </div>
                    <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
};