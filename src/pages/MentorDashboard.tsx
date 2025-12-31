import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMentorRelationships, StudentWithProfile } from "@/hooks/useMentorRelationships";
import { useMentorFeedback } from "@/hooks/useMentorFeedback";
import { 
  GraduationCap, 
  Users, 
  TrendingUp, 
  MessageSquare,
  BarChart3,
  Send,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Clock,
  Image,
  Wallet,
  Target,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Reply,
  Eye,
  MessageCircle,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface TradeConfirmation {
  id: string;
  confirmation_name: string;
}

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
  portfolio_name?: string;
  confirmations?: TradeConfirmation[];
}

interface StudentPortfolio {
  id: string;
  name: string;
  balance: number;
  drawdown: number | null;
  profit_goal: number | null;
}

interface StudentStrategy {
  id: string;
  name: string;
  description: string | null;
  confirmations: { id: string; name: string }[];
}

interface StudentStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
}

interface FeedbackReply {
  id: string;
  feedback_id: string;
  content: string;
  created_at: string;
  user_id: string;
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

const MentorDashboard = () => {
  const { myStudents, pendingRequests, loading: studentsLoading, removeStudent, respondToRequest } = useMentorRelationships();
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProfile | null>(null);
  const [studentTrades, setStudentTrades] = useState<StudentTrade[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [studentPortfolios, setStudentPortfolios] = useState<StudentPortfolio[]>([]);
  const [studentStrategies, setStudentStrategies] = useState<StudentStrategy[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [selectedTradeForView, setSelectedTradeForView] = useState<StudentTrade | null>(null);
  const [feedbackReplies, setFeedbackReplies] = useState<Record<string, FeedbackReply[]>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const { 
    tradeFeedback, 
    mentorNotes, 
    addTradeFeedback, 
    addMentorNote, 
    deleteFeedback, 
    deleteNote 
  } = useMentorFeedback(selectedStudent?.student_id);

  // Fetch feedback replies
  useEffect(() => {
    const fetchReplies = async () => {
      if (tradeFeedback.length === 0) return;
      
      const feedbackIds = tradeFeedback.map(f => f.id);
      const { data } = await supabase
        .from('feedback_replies')
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true });
      
      if (data) {
        const repliesMap: Record<string, FeedbackReply[]> = {};
        data.forEach(reply => {
          if (!repliesMap[reply.feedback_id]) {
            repliesMap[reply.feedback_id] = [];
          }
          repliesMap[reply.feedback_id].push(reply);
        });
        setFeedbackReplies(repliesMap);
      }
    };
    
    fetchReplies();
  }, [tradeFeedback]);

  // Fetch chat messages for selected student
  useEffect(() => {
    const fetchChatMessages = async () => {
      if (!selectedStudent) {
        setChatMessages([]);
        return;
      }

      const { data } = await supabase
        .from('mentor_messages')
        .select('*')
        .eq('relationship_id', selectedStudent.id)
        .order('created_at', { ascending: true });

      if (data) {
        // Fetch trade data for messages with trade_id
        const tradeIds = data.filter(m => m.trade_id).map(m => m.trade_id);
        let tradesMap: Record<string, StudentTrade> = {};
        
        if (tradeIds.length > 0) {
          const { data: tradesData } = await supabase
            .from('trades')
            .select('id, symbol, trade_type, pnl, entry_date, is_closed, entry_price, exit_price, quantity, rr, strategy, portfolio_id, notes, screenshot_url, created_at')
            .in('id', tradeIds);
          
          if (tradesData) {
            tradesMap = tradesData.reduce((acc, t) => ({ ...acc, [t.id]: t }), {});
          }
        }

        const messagesWithTrades = data.map(m => ({
          ...m,
          trade: m.trade_id ? tradesMap[m.trade_id] : null
        }));
        
        setChatMessages(messagesWithTrades);
      }
    };

    fetchChatMessages();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`mentor-chat-${selectedStudent?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mentor_messages',
          filter: `relationship_id=eq.${selectedStudent?.id}`
        },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          
          // Fetch trade if exists
          if (newMsg.trade_id) {
            const { data: tradeData } = await supabase
              .from('trades')
              .select('id, symbol, trade_type, pnl, entry_date, is_closed, entry_price, exit_price, quantity, rr, strategy, portfolio_id, notes, screenshot_url, created_at')
              .eq('id', newMsg.trade_id)
              .single();
            
            newMsg.trade = tradeData;
          }
          
          setChatMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStudent]);

  // Fetch student's trades, portfolios, and strategies when selected
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!selectedStudent) {
        setStudentTrades([]);
        setStudentStats(null);
        setStudentPortfolios([]);
        setStudentStrategies([]);
        return;
      }

      setLoadingTrades(true);
      try {
        // Fetch portfolios first for mapping
        const { data: portfoliosData, error: portfoliosError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: true });

        if (portfoliosError) throw portfoliosError;
        setStudentPortfolios(portfoliosData || []);

        const portfolioMap = new Map(portfoliosData?.map(p => [p.id, p.name]) || []);

        // Fetch trades
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: false });

        if (tradesError) throw tradesError;

        // Fetch trade confirmations for all trades
        let tradeConfirmationsMap = new Map<string, TradeConfirmation[]>();
        if (tradesData && tradesData.length > 0) {
          const tradeIds = tradesData.map(t => t.id);
          const { data: confirmationsData } = await supabase
            .from('trade_confirmations')
            .select('*')
            .in('trade_id', tradeIds);
          
          if (confirmationsData) {
            confirmationsData.forEach(conf => {
              if (!tradeConfirmationsMap.has(conf.trade_id)) {
                tradeConfirmationsMap.set(conf.trade_id, []);
              }
              tradeConfirmationsMap.get(conf.trade_id)!.push(conf);
            });
          }
        }

        const tradesWithDetails = (tradesData || []).map(trade => ({
          ...trade,
          portfolio_name: trade.portfolio_id ? portfolioMap.get(trade.portfolio_id) : undefined,
          confirmations: tradeConfirmationsMap.get(trade.id) || []
        }));

        setStudentTrades(tradesWithDetails);

        // Fetch strategies with confirmations
        const { data: strategiesData, error: strategiesError } = await supabase
          .from('strategies')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: false });

        if (strategiesError) throw strategiesError;

        if (strategiesData && strategiesData.length > 0) {
          const strategyIds = strategiesData.map(s => s.id);
          const { data: confirmationsData, error: confirmationsError } = await supabase
            .from('confirmations')
            .select('*')
            .in('strategy_id', strategyIds);

          if (confirmationsError) throw confirmationsError;

          const strategiesWithConfirmations = strategiesData.map(strategy => ({
            ...strategy,
            confirmations: (confirmationsData || []).filter(c => c.strategy_id === strategy.id)
          }));

          setStudentStrategies(strategiesWithConfirmations);
        } else {
          setStudentStrategies([]);
        }

        // Calculate stats
        if (tradesData && tradesData.length > 0) {
          const closedTrades = tradesData.filter(t => t.is_closed && t.pnl !== null);
          const wins = closedTrades.filter(t => (t.pnl || 0) > 0);
          const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
          const tradesWithRR = closedTrades.filter(t => t.rr);
          const avgRR = tradesWithRR.length > 0 
            ? tradesWithRR.reduce((sum, t) => sum + (t.rr || 0), 0) / tradesWithRR.length 
            : 0;
          
          setStudentStats({
            totalTrades: tradesData.length,
            winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
            totalPnl,
            avgRR,
          });
        } else {
          setStudentStats(null);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error("שגיאה בטעינת נתוני התלמיד");
      } finally {
        setLoadingTrades(false);
      }
    };

    fetchStudentData();
  }, [selectedStudent]);

  const handleAddNote = async () => {
    if (!selectedStudent || !newNote.trim()) return;

    const result = await addMentorNote(selectedStudent.student_id, newNote.trim());
    if (result.success) {
      toast.success("ההערה נוספה בהצלחה");
      setNewNote("");
    } else {
      toast.error("שגיאה בהוספת ההערה");
    }
  };

  const handleAddFeedback = async () => {
    if (!selectedStudent || !newFeedback.trim()) return;

    const result = await addTradeFeedback(
      selectedStudent.student_id,
      selectedTradeId,
      newFeedback.trim()
    );
    if (result.success) {
      toast.success("המשוב נוסף בהצלחה");
      setNewFeedback("");
      setSelectedTradeId(null);
    } else {
      toast.error("שגיאה בהוספת המשוב");
    }
  };

  const handleSendChatMessage = async () => {
    if (!selectedStudent || !newChatMessage.trim()) return;

    setSendingMessage(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("שגיאה באימות המשתמש");
      setSendingMessage(false);
      return;
    }

    const { error } = await supabase
      .from('mentor_messages')
      .insert({
        relationship_id: selectedStudent.id,
        sender_id: user.id,
        content: newChatMessage.trim()
      });

    if (!error) {
      setNewChatMessage("");
    } else {
      toast.error("שגיאה בשליחת ההודעה");
    }
    setSendingMessage(false);
  };

  const handleRemoveStudent = async (relationshipId: string) => {
    const result = await removeStudent(relationshipId);
    if (result.success) {
      toast.success("התלמיד הוסר בהצלחה");
      if (selectedStudent?.id === relationshipId) {
        setSelectedStudent(null);
      }
    } else {
      toast.error("שגיאה בהסרת התלמיד");
    }
  };

  const handleRespondToRequest = async (relationshipId: string, accept: boolean) => {
    const result = await respondToRequest(relationshipId, accept);
    if (result.success) {
      toast.success(accept ? "התלמיד אושר בהצלחה!" : "הבקשה נדחתה");
    } else {
      toast.error("שגיאה בטיפול בבקשה");
    }
  };

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

  if (studentsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">לוח מנטור</h1>
            <p className="text-muted-foreground text-sm">
              {myStudents.length} תלמידים פעילים • {pendingRequests.length} בקשות ממתינות
            </p>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground">
                בקשות ממתינות ({pendingRequests.length})
              </h3>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const displayName = getDisplayName(request.student_profile);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-card/50 backdrop-blur rounded-xl border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-amber-500/30">
                        <AvatarImage src={request.student_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-amber-500/20 text-amber-600 font-semibold">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: he })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
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
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                      >
                        <X className="h-4 w-4 ml-1" />
                        דחה
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {myStudents.length === 0 && pendingRequests.length === 0 ? (
          <Card className="bg-card border-border p-12 text-center">
            <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              אין לך תלמידים עדיין
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              תלמידים יכולים להוסיף אותך כמנטור דרך עמוד ההגדרות שלהם באמצעות שם המשתמש שלך
            </p>
          </Card>
        ) : myStudents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Students List */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    התלמידים שלי
                  </h3>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="p-2 space-y-1">
                    {myStudents.map((student) => {
                      const displayName = getDisplayName(student.student_profile);
                      const isSelected = selectedStudent?.id === student.id;
                      
                      return (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student)}
                          className={`w-full p-3 rounded-xl text-right transition-all ${
                            isSelected
                              ? "bg-primary/10 border-2 border-primary shadow-sm"
                              : "hover:bg-muted border-2 border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className={`h-11 w-11 ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
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
                            <ChevronLeft className={`h-4 w-4 transition-transform ${isSelected ? 'text-primary -translate-x-1' : 'text-muted-foreground'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Student Details */}
            <div className="lg:col-span-9">
              {selectedStudent ? (
                <div className="space-y-5">
                  {/* Student Header */}
                  <Card className="bg-card border-border overflow-hidden">
                    <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                    <div className="px-6 pb-6 -mt-10">
                      <div className="flex items-end justify-between">
                        <div className="flex items-end gap-4">
                          <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                            <AvatarImage src={selectedStudent.student_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                              {getInitials(getDisplayName(selectedStudent.student_profile))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="mb-1">
                            <h2 className="text-xl font-bold text-foreground">
                              {getDisplayName(selectedStudent.student_profile)}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              תלמיד מ-{format(new Date(selectedStudent.created_at), 'MMMM yyyy', { locale: he })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStudent(selectedStudent.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          <Trash2 className="h-4 w-4 ml-1" />
                          הסר
                        </Button>
                      </div>

                      {/* Stats */}
                      {studentStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                          <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">{studentStats.totalTrades}</p>
                            <p className="text-xs text-muted-foreground mt-1">סה"כ עסקאות</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <p className={`text-2xl font-bold ${studentStats.winRate >= 50 ? 'text-success' : 'text-destructive'}`}>
                              {studentStats.winRate.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">אחוז הצלחה</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <p className={`text-2xl font-bold ${studentStats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                              ${studentStats.totalPnl.toFixed(0)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">סה"כ רווח</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-foreground">{studentStats.avgRR.toFixed(1)}R</p>
                            <p className="text-xs text-muted-foreground mt-1">ממוצע RR</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Tabs */}
                  <Tabs defaultValue="trades" dir="rtl">
                    <TabsList className="grid w-full grid-cols-6 h-12">
                      <TabsTrigger value="trades" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">עסקאות</span>
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <MessageCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">צ'אט</span>
                      </TabsTrigger>
                      <TabsTrigger value="strategies" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Target className="h-4 w-4" />
                        <span className="hidden sm:inline">אסטרטגיות</span>
                      </TabsTrigger>
                      <TabsTrigger value="portfolios" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Wallet className="h-4 w-4" />
                        <span className="hidden sm:inline">תיקים</span>
                      </TabsTrigger>
                      <TabsTrigger value="feedback" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">משוב</span>
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">הערות</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Trades Tab */}
                    <TabsContent value="trades" className="mt-4">
                      <Card className="bg-card border-border">
                        {loadingTrades ? (
                          <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : studentTrades.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">אין עסקאות עדיין</p>
                          </div>
                        ) : (
                          <ScrollArea className="h-[500px]">
                            <div className="p-4 space-y-3">
                              {studentTrades.map((trade) => (
                                <div
                                  key={trade.id}
                                  className={`rounded-xl border-2 transition-all overflow-hidden ${
                                    selectedTradeId === trade.id
                                      ? "border-primary bg-primary/5"
                                      : "border-border bg-muted/30 hover:border-primary/50"
                                  }`}
                                >
                                  {/* Trade Header */}
                                  <div 
                                    className="p-4 cursor-pointer"
                                    onClick={() => setSelectedTradeId(selectedTradeId === trade.id ? null : trade.id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${trade.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                                          {trade.trade_type === 'long' 
                                            ? <ArrowUpRight className="h-5 w-5 text-success" />
                                            : <ArrowDownRight className="h-5 w-5 text-destructive" />
                                          }
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground text-lg">{trade.symbol}</span>
                                            <Badge variant={trade.is_closed ? 'outline' : 'secondary'} className="text-xs">
                                              {trade.is_closed ? 'סגורה' : 'פתוחה'}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2 mt-1">
                                            {trade.portfolio_name && (
                                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" />
                                                {trade.portfolio_name}
                                              </span>
                                            )}
                                            {trade.strategy && (
                                              <span className="text-xs text-primary flex items-center gap-1">
                                                <Target className="h-3 w-3" />
                                                {trade.strategy}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-left">
                                        {trade.pnl !== null && (
                                          <p className={`text-xl font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                          </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(trade.entry_date || trade.created_at), 'dd/MM/yyyy', { locale: he })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Trade Details */}
                                  <div className="px-4 pb-4 pt-0">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                      <div className="bg-background/60 p-3 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">כניסה</p>
                                        <p className="font-semibold text-foreground">${trade.entry_price}</p>
                                      </div>
                                      {trade.exit_price && (
                                        <div className="bg-background/60 p-3 rounded-lg">
                                          <p className="text-xs text-muted-foreground mb-1">יציאה</p>
                                          <p className="font-semibold text-foreground">${trade.exit_price}</p>
                                        </div>
                                      )}
                                      <div className="bg-background/60 p-3 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">כמות</p>
                                        <p className="font-semibold text-foreground">{trade.quantity}</p>
                                      </div>
                                      {trade.rr !== null && (
                                        <div className="bg-background/60 p-3 rounded-lg">
                                          <p className="text-xs text-muted-foreground mb-1">R:R</p>
                                          <p className={`font-semibold ${trade.rr >= 0 ? 'text-success' : 'text-destructive'}`}>
                                            {trade.rr.toFixed(2)}R
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Trade Confirmations */}
                                    {trade.confirmations && trade.confirmations.length > 0 && (
                                      <div className="mt-3 p-3 bg-success/10 rounded-lg border border-success/20">
                                        <p className="text-xs font-medium text-success mb-2 flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
                                          אישורים שסומנו ({trade.confirmations.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                          {trade.confirmations.map((conf) => (
                                            <Badge key={conf.id} variant="outline" className="text-xs bg-success/10 border-success/30 text-success">
                                              <Check className="h-3 w-3 ml-1" />
                                              {conf.confirmation_name}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Screenshot */}
                                    {trade.screenshot_url && (
                                      <div className="mt-3">
                                        <button
                                          onClick={() => setSelectedTradeForView(trade)}
                                          className="relative group w-full"
                                        >
                                          <img
                                            src={trade.screenshot_url}
                                            alt="Trade Screenshot"
                                            className="rounded-lg max-h-40 w-full object-cover"
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                            <Eye className="h-8 w-8 text-white" />
                                          </div>
                                        </button>
                                      </div>
                                    )}

                                    {trade.notes && (
                                      <div className="mt-3 p-3 bg-muted rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">הערות התלמיד:</p>
                                        <p className="text-sm text-foreground">{trade.notes}</p>
                                      </div>
                                    )}

                                    {/* Feedback input */}
                                    {selectedTradeId === trade.id && (
                                      <div className="mt-4 pt-4 border-t border-border">
                                        <p className="text-sm font-medium text-foreground mb-2">הוסף משוב על העסקה</p>
                                        <div className="flex gap-2">
                                          <Textarea
                                            value={newFeedback}
                                            onChange={(e) => setNewFeedback(e.target.value)}
                                            placeholder="כתוב משוב על העסקה הזו..."
                                            className="flex-1 min-h-[80px]"
                                          />
                                          <Button onClick={handleAddFeedback} disabled={!newFeedback.trim()} className="self-end">
                                            <Send className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Strategies Tab */}
                    <TabsContent value="strategies" className="mt-4">
                      <Card className="bg-card border-border p-4">
                        {studentStrategies.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Target className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">אין אסטרטגיות עדיין</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {studentStrategies.map((strategy) => (
                              <div
                                key={strategy.id}
                                className="p-5 rounded-xl bg-muted/50 border border-border"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 rounded-lg bg-primary/20">
                                    <Target className="h-5 w-5 text-primary" />
                                  </div>
                                  <h4 className="font-bold text-foreground text-lg">{strategy.name}</h4>
                                </div>
                                {strategy.description && (
                                  <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                                )}
                                {strategy.confirmations.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">
                                      אישורים ({strategy.confirmations.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {strategy.confirmations.map((confirmation) => (
                                        <Badge key={confirmation.id} variant="secondary" className="flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3 text-primary" />
                                          {confirmation.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Portfolios Tab */}
                    <TabsContent value="portfolios" className="mt-4">
                      <Card className="bg-card border-border p-4">
                        {studentPortfolios.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Wallet className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">אין תיקים עדיין</p>
                          </div>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {studentPortfolios.map((portfolio) => {
                              // Calculate current balance from trades
                              const portfolioTrades = studentTrades.filter(t => t.portfolio_id === portfolio.id);
                              const totalPnl = portfolioTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                              const currentBalance = portfolio.balance + totalPnl;
                              const progressToGoal = portfolio.profit_goal 
                                ? Math.min(100, (totalPnl / portfolio.profit_goal) * 100) 
                                : 0;
                              const drawdownUsed = portfolio.drawdown 
                                ? Math.min(100, Math.abs(Math.min(0, totalPnl)) / portfolio.drawdown * 100)
                                : 0;

                              return (
                                <div
                                  key={portfolio.id}
                                  className="p-5 rounded-xl bg-muted/50 border border-border"
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2 text-lg">
                                      <div className="p-2 rounded-lg bg-primary/20">
                                        <Wallet className="h-4 w-4 text-primary" />
                                      </div>
                                      {portfolio.name}
                                    </h4>
                                    <Badge variant={totalPnl >= 0 ? "default" : "destructive"}>
                                      {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(0)}$
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">יתרה נוכחית:</span>
                                      <span className={`font-bold ${currentBalance >= portfolio.balance ? 'text-success' : 'text-destructive'}`}>
                                        ${currentBalance.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">יתרה התחלתית:</span>
                                      <span className="text-foreground">${portfolio.balance.toLocaleString()}</span>
                                    </div>
                                    
                                    {portfolio.profit_goal && (
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-muted-foreground">יעד רווח:</span>
                                          <span className="text-success">${portfolio.profit_goal.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-success transition-all"
                                            style={{ width: `${Math.max(0, progressToGoal)}%` }}
                                          />
                                        </div>
                                        <p className="text-xs text-muted-foreground text-left">{progressToGoal.toFixed(0)}% מהיעד</p>
                                      </div>
                                    )}
                                    
                                    {portfolio.drawdown && (
                                      <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                          <span className="text-muted-foreground">Drawdown מקסימלי:</span>
                                          <span className="text-destructive">${portfolio.drawdown.toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                          <div 
                                            className="h-full bg-destructive transition-all"
                                            style={{ width: `${drawdownUsed}%` }}
                                          />
                                        </div>
                                        <p className="text-xs text-muted-foreground text-left">{drawdownUsed.toFixed(0)}% נוצל</p>
                                      </div>
                                    )}
                                    
                                    <div className="pt-2 border-t border-border">
                                      <p className="text-xs text-muted-foreground">
                                        {portfolioTrades.length} עסקאות בתיק
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Feedback Tab */}
                    <TabsContent value="feedback" className="mt-4">
                      <Card className="bg-card border-border p-4">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Textarea
                              value={newFeedback}
                              onChange={(e) => setNewFeedback(e.target.value)}
                              placeholder="כתוב משוב כללי על המסחר..."
                              className="flex-1 min-h-[80px]"
                            />
                            <Button onClick={handleAddFeedback} disabled={!newFeedback.trim()} className="self-end">
                              <Send className="h-4 w-4 ml-1" />
                              שלח
                            </Button>
                          </div>

                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3 pr-4">
                              {tradeFeedback.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                                  <p className="text-muted-foreground">אין משובים עדיין</p>
                                </div>
                              ) : (
                                tradeFeedback.map((feedback) => (
                                  <div
                                    key={feedback.id}
                                    className="p-4 bg-muted/50 rounded-xl border border-border"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge variant="outline" className="text-xs">
                                            מנטור
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                          </span>
                                        </div>
                                        <p className="text-foreground">{feedback.content}</p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteFeedback(feedback.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    
                                    {/* Student Replies */}
                                    {feedbackReplies[feedback.id] && feedbackReplies[feedback.id].length > 0 && (
                                      <div className="mt-3 mr-4 space-y-2 border-r-2 border-primary/30 pr-3">
                                        {feedbackReplies[feedback.id].map((reply) => (
                                          <div key={reply.id} className="bg-background/60 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Reply className="h-3 w-3 text-primary" />
                                              <Badge variant="secondary" className="text-xs">
                                                תלמיד
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                {format(new Date(reply.created_at), 'dd/MM HH:mm', { locale: he })}
                                              </span>
                                            </div>
                                            <p className="text-sm text-foreground">{reply.content}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </Card>
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="mt-4">
                      <Card className="bg-card border-border p-4">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="כתוב הערה פרטית (רק אתה תראה)..."
                              className="flex-1 min-h-[80px]"
                            />
                            <Button onClick={handleAddNote} disabled={!newNote.trim()} className="self-end">
                              <Send className="h-4 w-4 ml-1" />
                              שמור
                            </Button>
                          </div>

                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3 pr-4">
                              {mentorNotes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
                                  <p className="text-muted-foreground">אין הערות עדיין</p>
                                </div>
                              ) : (
                                mentorNotes.map((note) => (
                                  <div
                                    key={note.id}
                                    className="p-4 bg-muted/50 rounded-xl border border-border"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="text-foreground">{note.content}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                          {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                        </p>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteNote(note.id)}
                                        className="text-muted-foreground hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      </Card>
                    </TabsContent>

                    {/* Chat Tab */}
                    <TabsContent value="chat" className="mt-4">
                      <Card className="bg-card border-border h-[500px] flex flex-col">
                        <div className="p-4 border-b border-border bg-muted/30">
                          <h3 className="font-semibold flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            צ'אט עם {getDisplayName(selectedStudent.student_profile)}
                          </h3>
                        </div>
                        
                        <ScrollArea className="flex-1 p-4">
                          <div className="space-y-4">
                            {chatMessages.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8">
                                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>אין הודעות עדיין. התחל את השיחה!</p>
                              </div>
                            ) : (
                              chatMessages.map((message) => {
                                const isMe = message.sender_id !== selectedStudent.student_id;
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

                        <div className="p-4 border-t border-border bg-background">
                          <div className="flex gap-2">
                            <Input
                              value={newChatMessage}
                              onChange={(e) => setNewChatMessage(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendChatMessage();
                                }
                              }}
                              placeholder="כתוב הודעה..."
                              className="flex-1"
                              disabled={sendingMessage}
                            />
                            <Button
                              onClick={handleSendChatMessage}
                              disabled={!newChatMessage.trim() || sendingMessage}
                              size="icon"
                            >
                              {sendingMessage ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Card className="bg-card border-border h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                      <ChevronRight className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      בחר תלמיד
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      לחץ על תלמיד מהרשימה כדי לצפות בעסקאות, אסטרטגיות ופרטים נוספים
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Trade Screenshot Dialog */}
      <Dialog open={!!selectedTradeForView} onOpenChange={() => setSelectedTradeForView(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedTradeForView?.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                {selectedTradeForView?.trade_type === 'long' 
                  ? <ArrowUpRight className="h-5 w-5 text-success" />
                  : <ArrowDownRight className="h-5 w-5 text-destructive" />
                }
              </div>
              <span>{selectedTradeForView?.symbol}</span>
              {selectedTradeForView && selectedTradeForView.pnl !== null && (
                <Badge variant={selectedTradeForView.pnl >= 0 ? "default" : "destructive"}>
                  {selectedTradeForView.pnl >= 0 ? '+' : ''}${selectedTradeForView.pnl.toFixed(2)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTradeForView?.screenshot_url && (
            <img
              src={selectedTradeForView.screenshot_url}
              alt="Trade Screenshot"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MentorDashboard;
