import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Loader2, Sparkles, User, Plus, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Trade, TradeStats } from "@/hooks/useTrades";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface AITradingAdvisorProps {
  trades: Trade[];
  stats: TradeStats;
}

export default function AITradingAdvisor({ trades, stats }: AITradingAdvisorProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [confirmations, setConfirmations] = useState<any[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [strategyConfirmations, setStrategyConfirmations] = useState<any[]>([]);
  
  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    fetchConfirmations();
    fetchStrategies();
  }, [trades]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);
    
    const { data, error } = await supabase
      .from("ai_chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    
    if (!error && data) {
      setConversations(data);
    }
    setLoadingConversations(false);
  };

  const loadConversationMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (!error && data) {
      setMessages(data.map(m => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
    setActiveConversationId(conversationId);
  };

  const createNewConversation = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from("ai_chat_conversations")
      .insert({ user_id: user.id, title: "שיחה חדשה" })
      .select()
      .single();
    
    if (!error && data) {
      setConversations(prev => [data, ...prev]);
      setActiveConversationId(data.id);
      setMessages([]);
      return data.id;
    }
    return null;
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase
      .from("ai_chat_conversations")
      .delete()
      .eq("id", id);
    
    if (!error) {
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast.success("השיחה נמחקה");
    }
  };

  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    await supabase.from("ai_chat_messages").insert({
      conversation_id: conversationId,
      role,
      content
    });
  };

  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    await supabase
      .from("ai_chat_conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, title } : c
    ));
  };

  const fetchConfirmations = async () => {
    if (trades.length === 0) return;
    
    const tradeIds = trades.map(t => t.id);
    const { data } = await supabase
      .from("trade_confirmations")
      .select("*")
      .in("trade_id", tradeIds);
    
    if (data) setConfirmations(data);
  };

  const fetchStrategies = async () => {
    const { data: strategiesData } = await supabase
      .from("strategies")
      .select("*");
    
    if (strategiesData) {
      setStrategies(strategiesData);
      
      const strategyIds = strategiesData.map(s => s.id);
      if (strategyIds.length > 0) {
        const { data: confsData } = await supabase
          .from("confirmations")
          .select("*")
          .in("strategy_id", strategyIds);
        
        if (confsData) setStrategyConfirmations(confsData);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    let conversationId = activeConversationId;
    const isNewConversation = !conversationId;
    
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) {
        toast.error("שגיאה ביצירת שיחה");
        return;
      }
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message
    await saveMessage(conversationId, "user", userMessage.content);
    
    // Update title if new conversation
    if (isNewConversation) {
      await updateConversationTitle(conversationId, userMessage.content);
    }

    try {
      const tradingData = {
        trades,
        stats,
        confirmations,
        strategies: strategies.map(s => ({
          ...s,
          confirmations: strategyConfirmations.filter(c => c.strategy_id === s.id)
        }))
      };

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("יש להתחבר כדי להשתמש בייעוץ AI");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trading-ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            tradingData
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("הגעת למגבלת הבקשות, נסה שוב מאוחר יותר");
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: assistantContent
                };
                return newMessages;
              });
            }
          } catch {
            // Partial JSON, continue
          }
        }
      }

      // Save assistant message
      if (assistantContent) {
        await saveMessage(conversationId, "assistant", assistantContent);
      }

    } catch (error) {
      console.error("AI Chat error:", error);
      toast.error("שגיאה בתקשורת עם היועץ");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    "באיזה יום אני הכי רווחי?",
    "איזה אישור הכי עוזר לי?",
    "איפה אני צריך להשתפר?",
    "תנתח את הביצועים שלי"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir="rtl">
      {/* Conversations Sidebar */}
      <Card className="md:col-span-1 h-[600px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">שיחות קודמות</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setActiveConversationId(null);
                setMessages([]);
              }}
              title="שיחה חדשה"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-2 overflow-hidden">
          <ScrollArea className="h-full">
            {loadingConversations ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                אין שיחות קודמות
              </p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                      activeConversationId === conv.id ? "bg-muted" : ""
                    }`}
                    onClick={() => loadConversationMessages(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate flex-1">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="md:col-span-3 h-[600px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            יועץ מסחר AI
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">ברוכים הבאים ליועץ המסחר</h3>
                  <p className="text-sm text-muted-foreground">
                    שאל אותי כל שאלה על הביצועים שלך
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestedQuestions.map((q, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(q)}
                      className="text-xs"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap text-right">{msg.content}</p>
                    </div>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.content === "" && (
                  <div className="flex gap-3 justify-end">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="שאל את היועץ..."
                disabled={isLoading}
                className="flex-1 text-right"
                dir="rtl"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
