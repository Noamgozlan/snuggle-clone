import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMentorRelationships, StudentWithProfile } from "@/hooks/useMentorRelationships";
import { useMentorFeedback } from "@/hooks/useMentorFeedback";
import { StudentListPanel } from "@/components/mentor/StudentListPanel";
import { StudentHeader } from "@/components/mentor/StudentHeader";
import { StudentTabs } from "@/components/mentor/StudentTabs";
import { TradesTab } from "@/components/mentor/TradesTab";
import { ChatTab } from "@/components/mentor/ChatTab";
import { 
  GraduationCap, 
  Users, 
  MessageSquare,
  BarChart3,
  Send,
  Trash2,
  ChevronRight,
  Target,
  Wallet,
  Reply,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const { myStudents, pendingRequests, loading: studentsLoading, removeStudent, respondToRequest } = useMentorRelationships();
  const [selectedStudent, setSelectedStudent] = useState<StudentWithProfile | null>(null);
  const [studentTrades, setStudentTrades] = useState<StudentTrade[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [studentPortfolios, setStudentPortfolios] = useState<StudentPortfolio[]>([]);
  const [studentStrategies, setStudentStrategies] = useState<StudentStrategy[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [selectedTradeForFeedback, setSelectedTradeForFeedback] = useState<string | null>(null);
  const [selectedTradeForView, setSelectedTradeForView] = useState<StudentTrade | null>(null);
  const [feedbackReplies, setFeedbackReplies] = useState<Record<string, FeedbackReply[]>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatTradeDetail, setChatTradeDetail] = useState<StudentTrade | null>(null);
  const [activeTab, setActiveTab] = useState("trades");

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
        const { data: portfoliosData, error: portfoliosError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: true });

        if (portfoliosError) throw portfoliosError;
        setStudentPortfolios(portfoliosData || []);

        const portfolioMap = new Map(portfoliosData?.map(p => [p.id, p.name]) || []);

        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: false });

        if (tradesError) throw tradesError;

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
      selectedTradeForFeedback,
      newFeedback.trim()
    );
    if (result.success) {
      toast.success("המשוב נוסף בהצלחה");
      setNewFeedback("");
      setSelectedTradeForFeedback(null);
    } else {
      toast.error("שגיאה בהוספת המשוב");
    }
  };

  const handleSendChatMessage = useCallback(async (content: string) => {
    if (!selectedStudent) return;

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
        content: content
      });

    if (error) {
      toast.error("שגיאה בשליחת ההודעה");
    }
    setSendingMessage(false);
  }, [selectedStudent]);

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

  const handleGiveFeedback = (tradeId: string) => {
    setSelectedTradeForFeedback(tradeId);
    setActiveTab("feedback");
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
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 shadow-lg shadow-primary/25">
              <GraduationCap className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">לוח מנטור</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm text-muted-foreground">{myStudents.length} תלמידים</span>
                </div>
                {pendingRequests.length > 0 && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-sm text-amber-600 font-medium">{pendingRequests.length} ממתינות</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {myStudents.length === 0 && pendingRequests.length === 0 ? (
          <Card className="bg-gradient-to-br from-card to-muted/30 border-border overflow-hidden">
            <div className="p-8 md:p-16 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
              <div className="relative">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-muted to-muted/50 w-fit mx-auto mb-6 shadow-inner">
                  <Users className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
                  אין לך תלמידים עדיין
                </h3>
                <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">
                  תלמידים יכולים להוסיף אותך כמנטור דרך עמוד ההגדרות שלהם באמצעות שם המשתמש שלך
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className={`grid gap-4 md:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'}`}>
            {/* Students List Panel */}
            <div className={isMobile ? '' : 'lg:col-span-3'}>
              <StudentListPanel
                students={myStudents}
                pendingRequests={pendingRequests}
                selectedStudent={selectedStudent}
                onSelectStudent={setSelectedStudent}
                onRespondToRequest={respondToRequest}
              />
            </div>

            {/* Student Details */}
            <div className={isMobile ? '' : 'lg:col-span-9'}>
              {selectedStudent ? (
                <div className="space-y-4 md:space-y-5">
                  <StudentHeader
                    student={selectedStudent}
                    stats={studentStats}
                    onRemoveStudent={handleRemoveStudent}
                  />

                  <StudentTabs value={activeTab} onValueChange={setActiveTab}>
                    <TradesTab
                      trades={studentTrades}
                      loading={loadingTrades}
                      onViewTrade={setSelectedTradeForView}
                      onGiveFeedback={handleGiveFeedback}
                    />

                    <ChatTab
                      student={selectedStudent}
                      messages={chatMessages}
                      onSendMessage={handleSendChatMessage}
                      onOpenTradeDetail={setChatTradeDetail}
                      sending={sendingMessage}
                    />

                    {/* Strategies Tab */}
                    <TabsContent value="strategies" className="mt-4">
                      <Card className="bg-card border-border p-3 md:p-4">
                        {studentStrategies.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Target className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">אין אסטרטגיות עדיין</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                            {studentStrategies.map((strategy) => (
                              <div
                                key={strategy.id}
                                className="p-4 bg-muted/30 rounded-xl border border-border"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    <h4 className="font-semibold text-foreground">{strategy.name}</h4>
                                  </div>
                                  <Badge variant="outline">{strategy.confirmations.length} אישורים</Badge>
                                </div>
                                {strategy.description && (
                                  <p className="text-sm text-muted-foreground mb-3">{strategy.description}</p>
                                )}
                                {strategy.confirmations.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {strategy.confirmations.map((conf) => (
                                      <Badge key={conf.id} variant="secondary" className="text-xs">
                                        <CheckCircle2 className="h-3 w-3 ml-1" />
                                        {conf.name}
                                      </Badge>
                                    ))}
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
                      <Card className="bg-card border-border p-3 md:p-4">
                        {studentPortfolios.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Wallet className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">אין תיקים עדיין</p>
                          </div>
                        ) : (
                          <div className="grid gap-3 md:grid-cols-2 max-h-[60vh] overflow-y-auto">
                            {studentPortfolios.map((portfolio) => {
                              const portfolioTrades = studentTrades.filter(t => t.portfolio_id === portfolio.id);
                              const totalPnl = portfolioTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                              const progressToGoal = portfolio.profit_goal 
                                ? Math.min(100, (totalPnl / portfolio.profit_goal) * 100) 
                                : 0;
                              const drawdownUsed = portfolio.drawdown && totalPnl < 0 
                                ? Math.min(100, (Math.abs(totalPnl) / portfolio.drawdown) * 100)
                                : 0;

                              return (
                                <div
                                  key={portfolio.id}
                                  className="p-4 bg-muted/30 rounded-xl border border-border"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-5 w-5 text-primary" />
                                      <h4 className="font-semibold text-foreground">{portfolio.name}</h4>
                                    </div>
                                    <p className={`font-bold ${totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                      {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
                                    </p>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">יתרה:</span>
                                      <span className="font-medium text-foreground">${portfolio.balance.toLocaleString()}</span>
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
                                        <p className="text-xs text-muted-foreground text-left">{progressToGoal.toFixed(0)}% הושג</p>
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
                      <Card className="bg-card border-border p-3 md:p-4">
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row gap-2">
                            <Textarea
                              value={newFeedback}
                              onChange={(e) => setNewFeedback(e.target.value)}
                              placeholder={selectedTradeForFeedback ? "כתוב משוב על העסקה שנבחרה..." : "כתוב משוב כללי על המסחר..."}
                              className="flex-1 min-h-[80px]"
                            />
                            <Button onClick={handleAddFeedback} disabled={!newFeedback.trim()} className="self-end">
                              <Send className="h-4 w-4 ml-1" />
                              שלח
                            </Button>
                          </div>

                          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
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
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                          מנטור
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                        </span>
                                      </div>
                                      <p className="text-foreground text-sm">{feedback.content}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteFeedback(feedback.id)}
                                      className="text-muted-foreground hover:text-destructive shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {feedbackReplies[feedback.id] && feedbackReplies[feedback.id].length > 0 && (
                                    <div className="mt-3 mr-4 space-y-2 border-r-2 border-primary/30 pr-3">
                                      {feedbackReplies[feedback.id].map((reply) => (
                                        <div key={reply.id} className="bg-background/60 p-3 rounded-lg">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                        </div>
                      </Card>
                    </TabsContent>

                    {/* Notes Tab */}
                    <TabsContent value="notes" className="mt-4">
                      <Card className="bg-card border-border p-3 md:p-4">
                        <div className="space-y-4">
                          <div className="flex flex-col md:flex-row gap-2">
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

                          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
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
                                      <p className="text-foreground text-sm">{note.content}</p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteNote(note.id)}
                                      className="text-muted-foreground hover:text-destructive shrink-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </Card>
                    </TabsContent>
                  </StudentTabs>
                </div>
              ) : (
                <Card className="bg-card border-border h-[300px] md:h-[400px] flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                      <ChevronRight className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">
                      בחר תלמיד
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      {isMobile ? "לחץ על רשימת התלמידים למעלה" : "לחץ על תלמיד מהרשימה כדי לצפות בפרטים"}
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Trade Screenshot Dialog */}
      <Dialog open={!!selectedTradeForView} onOpenChange={() => setSelectedTradeForView(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTradeForView && (
                <>
                  <div className={`p-2 rounded-lg ${selectedTradeForView.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {selectedTradeForView.trade_type === 'long' 
                      ? <ArrowUpRight className="h-5 w-5 text-success" />
                      : <ArrowDownRight className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <span>{selectedTradeForView.symbol}</span>
                  {selectedTradeForView.pnl !== null && (
                    <Badge variant={selectedTradeForView.pnl >= 0 ? "default" : "destructive"}>
                      {selectedTradeForView.pnl >= 0 ? '+' : ''}${selectedTradeForView.pnl.toFixed(2)}
                    </Badge>
                  )}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTradeForView?.screenshot_url && (
            <div className="mt-4">
              <img 
                src={selectedTradeForView.screenshot_url} 
                alt="Trade Screenshot" 
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Trade Detail Dialog */}
      <Dialog open={!!chatTradeDetail} onOpenChange={() => setChatTradeDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {chatTradeDetail && (
                <>
                  <div className={`p-2 rounded-lg ${chatTradeDetail.trade_type === 'long' ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {chatTradeDetail.trade_type === 'long' 
                      ? <ArrowUpRight className="h-5 w-5 text-success" />
                      : <ArrowDownRight className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <span>{chatTradeDetail.symbol}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {chatTradeDetail && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">כניסה</p>
                  <p className="font-semibold">${chatTradeDetail.entry_price}</p>
                </div>
                {chatTradeDetail.exit_price && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">יציאה</p>
                    <p className="font-semibold">${chatTradeDetail.exit_price}</p>
                  </div>
                )}
                {chatTradeDetail.pnl !== null && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">רווח/הפסד</p>
                    <p className={`font-semibold ${chatTradeDetail.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {chatTradeDetail.pnl >= 0 ? '+' : ''}${chatTradeDetail.pnl.toFixed(2)}
                    </p>
                  </div>
                )}
                {chatTradeDetail.rr && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">R:R</p>
                    <p className="font-semibold">{chatTradeDetail.rr.toFixed(1)}R</p>
                  </div>
                )}
              </div>

              {chatTradeDetail.notes && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">הערות</p>
                  <p className="text-sm">{chatTradeDetail.notes}</p>
                </div>
              )}

              {chatTradeDetail.screenshot_url && (
                <div>
                  <img 
                    src={chatTradeDetail.screenshot_url} 
                    alt="Trade Screenshot" 
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MentorDashboard;
