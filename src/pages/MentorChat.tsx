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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, ArrowRight, Loader2, TrendingUp, ArrowUpRight, ArrowDownRight, X } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface Trade {
  id: string;
  symbol: string;
  trade_type: string;
  pnl: number | null;
  entry_date: string | null;
  is_closed: boolean;
  entry_price: number;
  exit_price: number | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  trade_id: string | null;
  trade?: Trade | null;
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
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [showTradeSelector, setShowTradeSelector] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
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

  // Fetch user's trades
  useEffect(() => {
    const fetchMyTrades = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('trades')
        .select('id, symbol, trade_type, pnl, entry_date, is_closed, entry_price, exit_price')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data) {
        setMyTrades(data);
      }
    };

    fetchMyTrades();
  }, [user]);

  // Fetch messages with trade data
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
        // Fetch trade data for messages with trade_id
        const tradeIds = data.filter(m => m.trade_id).map(m => m.trade_id);
        let tradesMap: Record<string, Trade> = {};
        
        if (tradeIds.length > 0) {
          const { data: tradesData } = await supabase
            .from('trades')
            .select('id, symbol, trade_type, pnl, entry_date, is_closed, entry_price, exit_price')
            .in('id', tradeIds);
          
          if (tradesData) {
            tradesMap = tradesData.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
          }
        }

        const messagesWithTrades = data.map(m => ({
          ...m,
          trade: m.trade_id ? tradesMap[m.trade_id] : null
        }));
        
        setMessages(messagesWithTrades);
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
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch trade if exists
          if (newMsg.trade_id) {
            const { data: tradeData } = await supabase
              .from('trades')
              .select('id, symbol, trade_type, pnl, entry_date, is_closed, entry_price, exit_price')
              .eq('id', newMsg.trade_id)
              .single();
            
            newMsg.trade = tradeData;
          }
          
          setMessages(prev => [...prev, newMsg]);
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
    if ((!newMessage.trim() && !selectedTrade) || !myMentor?.id || !user) return;

    setSending(true);
    const { error } = await supabase
      .from('mentor_messages')
      .insert({
        relationship_id: myMentor.id,
        sender_id: user.id,
        content: newMessage.trim() || (selectedTrade ? `שיתפתי עסקה: ${selectedTrade.symbol}` : ''),
        trade_id: selectedTrade?.id || null
      });

    if (!error) {
      setNewMessage("");
      setSelectedTrade(null);
    }
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectTrade = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowTradeSelector(false);
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

  const renderTradeCard = (trade: Trade, small = false) => (
    <div className={`bg-muted/50 rounded-lg border border-border ${small ? 'p-2' : 'p-3'}`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded ${trade.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
          {trade.trade_type === 'long' 
            ? <ArrowUpRight className={`${small ? 'h-3 w-3' : 'h-4 w-4'} text-success`} />
            : <ArrowDownRight className={`${small ? 'h-3 w-3' : 'h-4 w-4'} text-destructive`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${small ? 'text-xs' : 'text-sm'}`}>{trade.symbol}</p>
          {trade.entry_date && (
            <p className="text-[10px] text-muted-foreground">
              {format(new Date(trade.entry_date), 'dd/MM/yyyy', { locale: he })}
            </p>
          )}
        </div>
        {trade.pnl !== null && (
          <Badge 
            variant={trade.pnl >= 0 ? "default" : "destructive"} 
            className={small ? 'text-[10px] px-1.5 py-0' : ''}
          >
            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
          </Badge>
        )}
      </div>
    </div>
  );

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
                          {message.trade && (
                            <div className={`mb-2 ${isMe ? 'bg-primary-foreground/10' : 'bg-background/50'} rounded-lg p-2`}>
                              <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${message.trade.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                                  {message.trade.trade_type === 'long' 
                                    ? <ArrowUpRight className="h-4 w-4 text-success" />
                                    : <ArrowDownRight className="h-4 w-4 text-destructive" />
                                  }
                                </div>
                                <div className="flex-1">
                                  <p className={`font-medium text-sm ${isMe ? 'text-primary-foreground' : 'text-foreground'}`}>
                                    {message.trade.symbol}
                                  </p>
                                  <p className={`text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {message.trade.entry_date && format(new Date(message.trade.entry_date), 'dd/MM/yyyy', { locale: he })}
                                  </p>
                                </div>
                                {message.trade.pnl !== null && (
                                  <Badge variant={message.trade.pnl >= 0 ? "default" : "destructive"} className="text-xs">
                                    {message.trade.pnl >= 0 ? '+' : ''}${message.trade.pnl.toFixed(2)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          )}
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

            {/* Selected trade preview */}
            {selectedTrade && (
              <div className="px-4 py-2 border-t bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {renderTradeCard(selectedTrade, true)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedTrade(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowTradeSelector(true)}
                  title="שתף עסקה"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
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
                  disabled={(!newMessage.trim() && !selectedTrade) || sending}
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

      {/* Trade Selector Dialog */}
      <Dialog open={showTradeSelector} onOpenChange={setShowTradeSelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              בחר עסקה לשיתוף
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {myTrades.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">אין לך עסקאות עדיין</p>
              ) : (
                myTrades.map((trade) => (
                  <button
                    key={trade.id}
                    onClick={() => handleSelectTrade(trade)}
                    className="w-full text-right hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    {renderTradeCard(trade)}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MentorChat;
