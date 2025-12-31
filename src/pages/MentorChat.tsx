import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useMentorRelationships } from "@/hooks/useMentorRelationships";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

interface MentorProfile {
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

const MentorChat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { myMentor, loading: relationshipLoading } = useMentorRelationships();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mentorProfile, setMentorProfile] = useState<MentorProfile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get mentor profile
  useEffect(() => {
    const fetchMentorProfile = async () => {
      if (!myMentor) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, email, avatar_url')
        .eq('user_id', myMentor.mentor_id)
        .single();
      
      if (data) {
        setMentorProfile(data);
      }
    };

    fetchMentorProfile();
  }, [myMentor]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!myMentor?.id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('relationship_id', myMentor.id)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    if (!relationshipLoading) {
      fetchMessages();
    }
  }, [myMentor, relationshipLoading]);

  // Realtime subscription
  useEffect(() => {
    if (!myMentor?.id) return;

    const channel = supabase
      .channel('mentor-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentor_messages',
          filter: `relationship_id=eq.${myMentor.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myMentor?.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !myMentor?.id || !user) return;

    setSending(true);
    const { error } = await supabase
      .from('mentor_messages')
      .insert({
        relationship_id: myMentor.id,
        sender_id: user.id,
        content: newMessage.trim()
      });

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMentorDisplayName = () => {
    if (mentorProfile?.first_name && mentorProfile?.last_name) {
      return `${mentorProfile.first_name} ${mentorProfile.last_name}`;
    }
    if (mentorProfile?.username) return mentorProfile.username;
    if (mentorProfile?.email) return mentorProfile.email.split('@')[0];
    return 'המנטור שלי';
  };

  const getMentorInitials = () => {
    const name = getMentorDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (relationshipLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!myMentor || myMentor.status !== 'accepted') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">אין לך מנטור מאושר</h2>
            <p className="text-muted-foreground">
              כדי לשלוח הודעות למנטור, עליך להיות מחובר למנטור מאושר.
            </p>
          </div>
          <Button onClick={() => navigate('/settings')} className="gap-2">
            <ArrowRight className="h-4 w-4" />
            עבור להגדרות
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">צ'אט עם המנטור</h1>
            <p className="text-muted-foreground">התכתב עם המנטור שלך בזמן אמת</p>
          </div>
        </div>

        <Card className="h-[calc(100vh-280px)] flex flex-col">
          <CardHeader className="border-b bg-muted/30 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={mentorProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {getMentorInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{getMentorDisplayName()}</CardTitle>
                <p className="text-xs text-muted-foreground">המנטור שלי</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>אין הודעות עדיין. התחל את השיחה!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMe = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}
                          >
                            {format(new Date(message.created_at), 'HH:mm', { locale: he })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="כתוב הודעה..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MentorChat;
