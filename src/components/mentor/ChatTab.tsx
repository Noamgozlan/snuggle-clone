import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudentWithProfile } from "@/hooks/useMentorRelationships";
import { 
  MessageCircle, 
  Send, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  Loader2
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

  const getDisplayName = (profile?: { first_name: string | null; last_name: string | null; username: string | null; email: string | null }) => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.username) {
      return profile.username;
    }
    return profile?.email || "משתמש";
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    await onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <TabsContent value="chat" className="mt-4">
      <Card className="bg-card border-border flex flex-col h-[60vh] max-h-[500px]">
        <div className="p-3 md:p-4 border-b border-border bg-muted/30 shrink-0">
          <h3 className="font-semibold flex items-center gap-2 text-sm md:text-base">
            <MessageCircle className="h-4 w-4 text-primary" />
            צ'אט עם {getDisplayName(student.student_profile)}
          </h3>
        </div>
        
        <ScrollArea className="flex-1 p-3 md:p-4">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">אין הודעות עדיין. התחל את השיחה!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.sender_id !== student.student_id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-3 py-2 ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted rounded-bl-sm'
                      }`}
                    >
                      {message.trade && (
                        <button 
                          className={`w-full mb-2 ${isMe ? 'bg-primary-foreground/10' : 'bg-background/50'} rounded-lg p-2 hover:opacity-80 transition-opacity text-right`}
                          onClick={() => onOpenTradeDetail(message.trade!)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${message.trade.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                              {message.trade.trade_type === 'long' 
                                ? <ArrowUpRight className="h-4 w-4 text-success" />
                                : <ArrowDownRight className="h-4 w-4 text-destructive" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium text-sm ${isMe ? 'text-primary-foreground' : 'text-foreground'}`}>
                                {message.trade.symbol}
                              </p>
                              <p className={`text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {message.trade.entry_date && format(new Date(message.trade.entry_date), 'dd/MM/yyyy', { locale: he })}
                              </p>
                            </div>
                            {message.trade.pnl !== null && (
                              <Badge variant={message.trade.pnl >= 0 ? "default" : "destructive"} className="text-xs shrink-0">
                                {message.trade.pnl >= 0 ? '+' : ''}${message.trade.pnl.toFixed(0)}
                              </Badge>
                            )}
                            <Eye className={`h-4 w-4 shrink-0 ${isMe ? 'text-primary-foreground/50' : 'text-muted-foreground'}`} />
                          </div>
                        </button>
                      )}
                      {message.content && (
                        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
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

        <div className="p-3 md:p-4 border-t border-border bg-background shrink-0">
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
              onClick={handleSend}
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
      </Card>
    </TabsContent>
  );
};
