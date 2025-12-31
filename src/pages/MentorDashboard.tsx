import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMentorRelationships, StudentWithProfile } from "@/hooks/useMentorRelationships";
import { useMentorFeedback } from "@/hooks/useMentorFeedback";
import { 
  GraduationCap, 
  Users, 
  ArrowRight, 
  TrendingUp, 
  MessageSquare,
  Calendar,
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
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

  const { 
    tradeFeedback, 
    mentorNotes, 
    addTradeFeedback, 
    addMentorNote, 
    deleteFeedback, 
    deleteNote 
  } = useMentorFeedback(selectedStudent?.student_id);

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
        // Fetch trades
        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: false });

        if (tradesError) throw tradesError;
        setStudentTrades(tradesData || []);

        // Fetch portfolios
        const { data: portfoliosData, error: portfoliosError } = await supabase
          .from('portfolios')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: true });

        if (portfoliosError) throw portfoliosError;
        setStudentPortfolios(portfoliosData || []);

        // Fetch strategies with confirmations
        const { data: strategiesData, error: strategiesError } = await supabase
          .from('strategies')
          .select('*')
          .eq('user_id', selectedStudent.student_id)
          .order('created_at', { ascending: false });

        if (strategiesError) throw strategiesError;

        // Fetch all confirmations for these strategies
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
          const avgRR = closedTrades.filter(t => t.rr).reduce((sum, t) => sum + (t.rr || 0), 0) / (closedTrades.filter(t => t.rr).length || 1);
          
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          <span>לוח מנטור</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">לוח מנטור</h1>
            <p className="text-muted-foreground">
              צפה בתלמידים שלך ותן להם משוב
            </p>
          </div>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <Card className="bg-card border-border p-6 border-2 border-primary/30">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              בקשות ממתינות ({pendingRequests.length})
            </h3>
            <div className="space-y-3">
              {pendingRequests.map((request) => {
                const displayName = getDisplayName(request.student_profile);
                return (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={request.student_profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.student_profile?.email}
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
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              אין לך תלמידים עדיין
            </h3>
            <p className="text-muted-foreground">
              תלמידים יכולים להוסיף אותך כמנטור דרך עמוד ההגדרות שלהם
            </p>
          </Card>
        ) : myStudents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Students List */}
            <div className="lg:col-span-3">
              <Card className="bg-card border-border p-4">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  התלמידים שלי ({myStudents.length})
                </h3>
                <div className="space-y-2">
                  {myStudents.map((student) => {
                    const displayName = getDisplayName(student.student_profile);
                    const isSelected = selectedStudent?.id === student.id;
                    
                    return (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudent(student)}
                        className={`w-full p-3 rounded-lg text-right transition-all ${
                          isSelected
                            ? "bg-primary/10 border-2 border-primary"
                            : "bg-secondary/30 hover:bg-secondary/50 border-2 border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={student.student_profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {getInitials(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.student_profile?.email}
                            </p>
                          </div>
                          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Student Details */}
            <div className="lg:col-span-9">
              {selectedStudent ? (
                <div className="space-y-6">
                  {/* Student Header */}
                  <Card className="bg-card border-border p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedStudent.student_profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xl">
                            {getInitials(getDisplayName(selectedStudent.student_profile))}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">
                            {getDisplayName(selectedStudent.student_profile)}
                          </h2>
                          <p className="text-muted-foreground">
                            {selectedStudent.student_profile?.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveStudent(selectedStudent.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        הסר תלמיד
                      </Button>
                    </div>

                    {/* Stats */}
                    {studentStats && (
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-secondary/30 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-foreground">{studentStats.totalTrades}</p>
                          <p className="text-sm text-muted-foreground">עסקאות</p>
                        </div>
                        <div className="bg-secondary/30 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-foreground">{studentStats.winRate.toFixed(0)}%</p>
                          <p className="text-sm text-muted-foreground">אחוז הצלחה</p>
                        </div>
                        <div className={`bg-secondary/30 rounded-lg p-4 text-center ${studentStats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                          <p className="text-2xl font-bold">${studentStats.totalPnl.toFixed(0)}</p>
                          <p className="text-sm text-muted-foreground">סה"כ רווח</p>
                        </div>
                        <div className="bg-secondary/30 rounded-lg p-4 text-center">
                          <p className="text-2xl font-bold text-foreground">{studentStats.avgRR.toFixed(1)}</p>
                          <p className="text-sm text-muted-foreground">ממוצע RR</p>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Tabs */}
                  <Tabs defaultValue="trades" dir="rtl">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="trades" className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        עסקאות
                      </TabsTrigger>
                      <TabsTrigger value="strategies" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        אסטרטגיות
                      </TabsTrigger>
                      <TabsTrigger value="portfolios" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        תיקים
                      </TabsTrigger>
                      <TabsTrigger value="feedback" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        משוב
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        הערות
                      </TabsTrigger>
                    </TabsList>

                    {/* Trades Tab */}
                    <TabsContent value="trades">
                      <Card className="bg-card border-border p-4">
                        {loadingTrades ? (
                          <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : studentTrades.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            אין עסקאות עדיין
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {studentTrades.slice(0, 30).map((trade) => (
                              <div
                                key={trade.id}
                                className={`p-4 rounded-lg bg-secondary/30 border-2 transition-all ${
                                  selectedTradeId === trade.id
                                    ? "border-primary"
                                    : "border-transparent hover:border-primary/30"
                                }`}
                              >
                                <div 
                                  className="flex items-center justify-between cursor-pointer"
                                  onClick={() => setSelectedTradeId(selectedTradeId === trade.id ? null : trade.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge variant={trade.trade_type === 'long' ? 'default' : 'secondary'}>
                                      {trade.trade_type === 'long' ? 'LONG' : 'SHORT'}
                                    </Badge>
                                    <span className="font-semibold text-foreground">{trade.symbol}</span>
                                    <Badge variant={trade.is_closed ? 'outline' : 'secondary'}>
                                      {trade.is_closed ? 'סגורה' : 'פתוחה'}
                                    </Badge>
                                    {trade.screenshot_url && (
                                      <Image className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4">
                                    {trade.rr !== null && (
                                      <span className="text-sm text-muted-foreground">
                                        RR: {trade.rr.toFixed(1)}
                                      </span>
                                    )}
                                    {trade.pnl !== null && (
                                      <span className={`font-bold ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                                        ${trade.pnl.toFixed(2)}
                                      </span>
                                    )}
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(trade.entry_date || trade.created_at), 'dd/MM/yyyy', { locale: he })}
                                    </span>
                                  </div>
                                </div>

                                {/* Trade Details */}
                                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  <div className="bg-background/50 p-2 rounded">
                                    <span className="text-muted-foreground">כניסה: </span>
                                    <span className="text-foreground">${trade.entry_price}</span>
                                  </div>
                                  {trade.exit_price && (
                                    <div className="bg-background/50 p-2 rounded">
                                      <span className="text-muted-foreground">יציאה: </span>
                                      <span className="text-foreground">${trade.exit_price}</span>
                                    </div>
                                  )}
                                  <div className="bg-background/50 p-2 rounded">
                                    <span className="text-muted-foreground">כמות: </span>
                                    <span className="text-foreground">{trade.quantity}</span>
                                  </div>
                                  {trade.strategy && (
                                    <div className="bg-background/50 p-2 rounded col-span-2 md:col-span-4">
                                      <span className="text-muted-foreground">אסטרטגיה: </span>
                                      <span className="text-foreground font-medium">{trade.strategy}</span>
                                      {/* Show strategy confirmations */}
                                      {(() => {
                                        const matchedStrategy = studentStrategies.find(s => s.name === trade.strategy);
                                        if (matchedStrategy && matchedStrategy.confirmations.length > 0) {
                                          return (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                              {matchedStrategy.confirmations.map((conf) => (
                                                <Badge key={conf.id} variant="outline" className="text-xs flex items-center gap-1">
                                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                                  {conf.name}
                                                </Badge>
                                              ))}
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  )}
                                </div>

                                {/* Screenshot */}
                                {trade.screenshot_url && (
                                  <div className="mt-3">
                                    <img
                                      src={trade.screenshot_url}
                                      alt="Trade Screenshot"
                                      className="rounded-lg max-h-48 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setSelectedTradeForView(trade)}
                                    />
                                  </div>
                                )}

                                {trade.notes && (
                                  <p className="text-sm text-muted-foreground mt-3 bg-background/50 p-2 rounded">
                                    {trade.notes}
                                  </p>
                                )}

                                {/* Feedback input */}
                                {selectedTradeId === trade.id && (
                                  <div className="mt-4 pt-4 border-t border-border">
                                    <div className="flex gap-2">
                                      <Textarea
                                        value={newFeedback}
                                        onChange={(e) => setNewFeedback(e.target.value)}
                                        placeholder="כתוב משוב על העסקה הזו..."
                                        className="flex-1"
                                      />
                                      <Button onClick={handleAddFeedback} disabled={!newFeedback.trim()}>
                                        <Send className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Strategies Tab */}
                    <TabsContent value="strategies">
                      <Card className="bg-card border-border p-4">
                        {studentStrategies.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            אין אסטרטגיות עדיין
                          </p>
                        ) : (
                          <div className="space-y-4">
                            {studentStrategies.map((strategy) => (
                              <div
                                key={strategy.id}
                                className="p-4 rounded-lg bg-secondary/30 border border-border"
                              >
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="h-5 w-5 text-primary" />
                                  <h4 className="font-semibold text-foreground">{strategy.name}</h4>
                                </div>
                                {strategy.description && (
                                  <p className="text-sm text-muted-foreground mb-4">{strategy.description}</p>
                                )}
                                {strategy.confirmations.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-foreground">אישורים ({strategy.confirmations.length}):</p>
                                    <div className="flex flex-wrap gap-2">
                                      {strategy.confirmations.map((confirmation) => (
                                        <Badge key={confirmation.id} variant="outline" className="flex items-center gap-1">
                                          <CheckCircle2 className="h-3 w-3" />
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
                    <TabsContent value="portfolios">
                      <Card className="bg-card border-border p-4">
                        {studentPortfolios.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            אין תיקים עדיין
                          </p>
                        ) : (
                          <div className="grid gap-4 md:grid-cols-2">
                            {studentPortfolios.map((portfolio) => (
                              <div
                                key={portfolio.id}
                                className="p-4 rounded-lg bg-secondary/30 border border-border"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-primary" />
                                    {portfolio.name}
                                  </h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">יתרה התחלתית:</span>
                                    <span className="text-foreground font-medium">${portfolio.balance.toLocaleString()}</span>
                                  </div>
                                  {portfolio.drawdown && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Drawdown מקסימלי:</span>
                                      <span className="text-destructive font-medium">${portfolio.drawdown.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {portfolio.profit_goal && (
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">יעד רווח:</span>
                                      <span className="text-success font-medium">${portfolio.profit_goal.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Feedback Tab */}
                    <TabsContent value="feedback">
                      <Card className="bg-card border-border p-4">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Textarea
                              value={newFeedback}
                              onChange={(e) => setNewFeedback(e.target.value)}
                              placeholder="כתוב משוב כללי על המסחר..."
                              className="flex-1"
                            />
                            <Button onClick={handleAddFeedback} disabled={!newFeedback.trim()}>
                              <Send className="h-4 w-4 ml-1" />
                              שלח
                            </Button>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {tradeFeedback.length === 0 ? (
                              <p className="text-center text-muted-foreground py-4">
                                אין משובים עדיין
                              </p>
                            ) : (
                              tradeFeedback.map((feedback) => (
                                <div
                                  key={feedback.id}
                                  className="p-4 bg-secondary/30 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-foreground">{feedback.content}</p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {format(new Date(feedback.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteFeedback(feedback.id)}
                                      className="text-destructive hover:text-destructive"
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

                    {/* Notes Tab */}
                    <TabsContent value="notes">
                      <Card className="bg-card border-border p-4">
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <Textarea
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              placeholder="כתוב הערה כללית לתלמיד..."
                              className="flex-1"
                            />
                            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                              <Send className="h-4 w-4 ml-1" />
                              שלח
                            </Button>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {mentorNotes.length === 0 ? (
                              <p className="text-center text-muted-foreground py-4">
                                אין הערות עדיין
                              </p>
                            ) : (
                              mentorNotes.map((note) => (
                                <div
                                  key={note.id}
                                  className="p-4 bg-secondary/30 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="text-foreground">{note.content}</p>
                                      <p className="text-xs text-muted-foreground mt-2">
                                        {format(new Date(note.created_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => deleteNote(note.id)}
                                      className="text-destructive hover:text-destructive"
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
                  </Tabs>
                </div>
              ) : (
                <Card className="bg-card border-border p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <ChevronRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      בחר תלמיד
                    </h3>
                    <p className="text-muted-foreground">
                      לחץ על תלמיד מהרשימה כדי לצפות בפרטים שלו
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
            <DialogTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {selectedTradeForView?.symbol} - {selectedTradeForView?.trade_type === 'long' ? 'LONG' : 'SHORT'}
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
