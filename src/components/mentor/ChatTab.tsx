import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudentWithProfile } from "@/hooks/useMentorRelationships";
import { 
  MessageCircle, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  Loader2,
  Sparkles,
  User
} from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface StudentTrade {
  id: string;
  symbol: string;
  trade_type: string;
  pnl: number | null;
  entry_date: string | null;
  created_at: string;
  is_closed: boolean;
  notes: string | null;
  screenshot_url: string | null;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  rr: number | null;
  strategy: string | null;
  portfolio_id: string | null;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  trade_id: string | null;
  trade?: StudentTrade | null;
}

interface ChatTabProps {
  student: StudentWithProfile;
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  onOpenTradeDetail: (trade: StudentTrade) => void;
  sending: boolean;
}

export const ChatTab = ({ student, messages, onSendMessage, onOpenTradeDetail, sending }: ChatTabProps) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getDisplayName = (profile?: { first_name: string | null; last_name: string | null; username: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.username) {
      return profile.username;
    }
    return profile?.email || "משתמש";
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    const message = newMessage.trim();
    setNewMessage("");
    await onSendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <TabsContent value="chat" className="mt-4">
      <Card className="bg-card border-border flex flex-col h-[65vh] max-h-[550px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-gradient-to-l from-muted/50 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10">
              <MessageCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                צ'אט עם {getDisplayName(student.student_profile)}
              </h3>
              <p className="text-xs text-muted-foreground">{messages.length} הודעות</p>
            </div>
          </div>
        </div>
        
        {/* Messages Area */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 rounded-2xl bg-muted/50 mb-4">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">התחל שיחה</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  שלח הודעה לתלמיד שלך כדי להתחיל את הדיאלוג
                </p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => {
                  const isMe = message.sender_id !== student.student_id;
                  const showDate = index === 0 || 
                    format(new Date(message.created_at), 'yyyy-MM-dd') !== 
                    format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');
                  
                  return (
                    <div key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <Badge variant="outline" className="text-xs bg-muted/50">
                            {format(new Date(message.created_at), 'EEEE, d בMMMM', { locale: he })}
                          </Badge>
                        </div>
                      )}
                      <div className={`flex gap-2 ${isMe ? 'justify-start' : 'justify-end'}`}>
                        {isMe && (
                          <div className="p-1.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 ${
                            isMe
                              ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md shadow-lg shadow-primary/20'
                              : 'bg-muted rounded-bl-md'
                          }`}
                        >
                          {message.trade && (
                            <button 
                              className={`w-full mb-2 ${
                                isMe ? 'bg-white/10' : 'bg-background'
                              } rounded-xl p-3 hover:opacity-90 transition-all text-right border ${
                                isMe ? 'border-white/20' : 'border-border'
                              }`}
                              onClick={() => onOpenTradeDetail(message.trade!)}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg ${
                                  message.trade.trade_type === 'long' 
                                    ? 'bg-success/20' 
                                    : 'bg-destructive/20'
                                }`}>
                                  {message.trade.trade_type === 'long' 
                                    ? <ArrowUpRight className="h-4 w-4 text-success" />
                                    : <ArrowDownRight className="h-4 w-4 text-destructive" />
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-bold text-sm ${
                                    isMe ? 'text-primary-foreground' : 'text-foreground'
                                  }`}>
                                    {message.trade.symbol}
                                  </p>
                                  <p className={`text-xs ${
                                    isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {message.trade.entry_date && format(new Date(message.trade.entry_date), 'dd/MM/yyyy', { locale: he })}
                                  </p>
                                </div>
                                {message.trade.pnl !== null && (
                                  <Badge 
                                    className={`text-xs shrink-0 ${
                                      message.trade.pnl >= 0 
                                        ? 'bg-success/20 text-success border-success/30' 
                                        : 'bg-destructive/20 text-destructive border-destructive/30'
                                    }`}
                                  >
                                    {message.trade.pnl >= 0 ? '+' : ''}${message.trade.pnl.toFixed(0)}
                                  </Badge>
                                )}
                                <Eye className={`h-4 w-4 shrink-0 ${
                                  isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'
                                }`} />
                              </div>
                            </button>
                          )}
                          {message.content && (
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.content}
                            </p>
                          )}
                          <p className={`text-[10px] mt-2 ${
                            isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(message.created_at), 'HH:mm', { locale: he })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-gradient-to-t from-muted/30 to-transparent shrink-0">
          <div className="flex gap-3 items-end">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="כתוב הודעה..."
              className="flex-1 min-h-[44px] max-h-32 resize-none bg-background border-border/50 focus:border-primary/50 rounded-xl"
              disabled={sending}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow shrink-0"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
};