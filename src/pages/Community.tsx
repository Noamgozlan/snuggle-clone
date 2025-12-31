import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PublicProfileDialog } from "@/components/profile/PublicProfileDialog";
import {
  Send,
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  X,
  Loader2,
  Trash2,
} from "lucide-react";

interface SharedTrade {
  id: string;
  user_id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  pnl_percentage: number | null;
  strategy: string | null;
  notes: string | null;
  is_closed: boolean;
  trade_date: string;
  created_at: string;
  screenshot_url: string | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trades, setTrades] = useState<SharedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    fetchTrades();
    
    const channel = supabase
      .channel('shared-trades-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_trades'
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTrades = async () => {
    try {
      const { data: tradesData, error: tradesError } = await supabase
        .from('shared_trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (tradesError) throw tradesError;

      if (!tradesData || tradesData.length === 0) {
        setTrades([]);
        return;
      }

      const userIds = [...new Set(tradesData.map(t => t.user_id))];
      const tradeIds = tradesData.map(t => t.id);
      
      const [profilesResult, likesResult, commentsResult, userLikesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, first_name, last_name, username, avatar_url')
          .in('user_id', userIds),
        supabase
          .from('shared_trade_likes')
          .select('shared_trade_id')
          .in('shared_trade_id', tradeIds),
        supabase
          .from('shared_trade_comments')
          .select('shared_trade_id')
          .in('shared_trade_id', tradeIds),
        user ? supabase
          .from('shared_trade_likes')
          .select('shared_trade_id')
          .eq('user_id', user.id)
          .in('shared_trade_id', tradeIds) : { data: [] }
      ]);

      const profilesMap = new Map(
        profilesResult.data?.map(p => [p.user_id, p]) || []
      );

      const likesCount = (likesResult.data || []).reduce((acc, like) => {
        acc[like.shared_trade_id] = (acc[like.shared_trade_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commentsCount = (commentsResult.data || []).reduce((acc, comment) => {
        acc[comment.shared_trade_id] = (acc[comment.shared_trade_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const userLikedTrades = new Set(
        (userLikesResult.data || []).map(l => l.shared_trade_id)
      );

      const tradesWithData = tradesData.map(trade => ({
        ...trade,
        profiles: profilesMap.get(trade.user_id) || null,
        likes_count: likesCount[trade.id] || 0,
        comments_count: commentsCount[trade.id] || 0,
        is_liked: userLikedTrades.has(trade.id),
      })) as SharedTrade[];

      setTrades(tradesWithData);
    } catch (error) {
      console.error('Error fetching trades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPostImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!user || (!newPost.trim() && !postImage)) return;

    setPosting(true);
    try {
      let screenshotUrl: string | null = null;

      if (postImage) {
        const fileExt = postImage.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('trade-screenshots')
          .upload(fileName, postImage);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('trade-screenshots')
          .getPublicUrl(fileName);
        
        screenshotUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('shared_trades').insert({
        user_id: user.id,
        symbol: "POST",
        trade_type: "long",
        entry_price: 0,
        notes: newPost || null,
        screenshot_url: screenshotUrl,
        is_closed: true,
      });

      if (error) throw error;

      toast({
        title: "הפוסט פורסם בהצלחה!",
      });

      setNewPost("");
      setPostImage(null);
      setPostImagePreview(null);
    } catch (error) {
      console.error('Error posting:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לפרסם את הפוסט",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (tradeId: string, isLiked: boolean) => {
    if (!user) {
      toast({
        title: "יש להתחבר כדי לתת לייק",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('shared_trade_likes')
          .delete()
          .eq('shared_trade_id', tradeId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('shared_trade_likes')
          .insert({ shared_trade_id: tradeId, user_id: user.id });
      }

      setTrades(prev => prev.map(t => 
        t.id === tradeId 
          ? { 
              ...t, 
              is_liked: !isLiked, 
              likes_count: isLiked ? t.likes_count - 1 : t.likes_count + 1 
            } 
          : t
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const fetchComments = async (tradeId: string) => {
    setLoadingComments(tradeId);
    try {
      const { data: commentsData, error } = await supabase
        .from('shared_trade_comments')
        .select('*')
        .eq('shared_trade_id', tradeId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, username, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const commentsWithProfiles = commentsData.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || null,
        })) as Comment[];

        setComments(prev => ({ ...prev, [tradeId]: commentsWithProfiles }));
      } else {
        setComments(prev => ({ ...prev, [tradeId]: [] }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(null);
    }
  };

  const toggleComments = async (tradeId: string) => {
    if (expandedComments === tradeId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(tradeId);
      if (!comments[tradeId]) {
        await fetchComments(tradeId);
      }
    }
  };

  const handleAddComment = async (tradeId: string) => {
    if (!user || !newComment[tradeId]?.trim()) return;

    try {
      const { data, error } = await supabase
        .from('shared_trade_comments')
        .insert({
          shared_trade_id: tradeId,
          user_id: user.id,
          content: newComment[tradeId],
        })
        .select()
        .single();

      if (error) throw error;

      // Get current user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, username, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const newCommentWithProfile: Comment = {
        ...data,
        profiles: profileData || null,
      };

      setComments(prev => ({
        ...prev,
        [tradeId]: [...(prev[tradeId] || []), newCommentWithProfile],
      }));

      setTrades(prev => prev.map(t =>
        t.id === tradeId ? { ...t, comments_count: t.comments_count + 1 } : t
      ));

      setNewComment(prev => ({ ...prev, [tradeId]: "" }));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף תגובה",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (tradeId: string) => {
    if (!user || !isAdmin) return;
    
    setDeletingPost(tradeId);
    try {
      const { error } = await supabase
        .from('shared_trades')
        .delete()
        .eq('id', tradeId);
      
      if (error) throw error;
      
      setTrades(prev => prev.filter(t => t.id !== tradeId));
      toast({
        title: "הפוסט נמחק בהצלחה",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הפוסט",
        variant: "destructive",
      });
    } finally {
      setDeletingPost(null);
    }
  };

  const getUserDisplayName = (profile: SharedTrade['profiles'] | Comment['profiles']) => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    if (profile?.username) {
      return profile.username;
    }
    return "סוחר אנונימי";
  };

  const getInitials = (profile: SharedTrade['profiles'] | Comment['profiles']) => {
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (profile?.username) {
      return profile.username.charAt(0).toUpperCase();
    }
    return "?";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'עכשיו';
    if (diffInSeconds < 3600) return `לפני ${Math.floor(diffInSeconds / 60)} דקות`;
    if (diffInSeconds < 86400) return `לפני ${Math.floor(diffInSeconds / 3600)} שעות`;
    if (diffInSeconds < 604800) return `לפני ${Math.floor(diffInSeconds / 86400)} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  return (
    <DashboardLayout title="קהילת סוחרים">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Create Post Card */}
        <Card className="bg-card border-border p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user ? getInitials(null) : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="מה עובר לך בראש? שתף את הקהילה... (אפשר גם להדביק תמונות Ctrl+V)"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[60px] resize-none bg-background border-border"
              />
              
              {postImagePreview && (
                <div className="relative">
                  <img 
                    src={postImagePreview} 
                    alt="Preview" 
                    className="max-h-64 rounded-lg object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => {
                      setPostImage(null);
                      setPostImagePreview(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  תמונה
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  onClick={handlePost}
                  disabled={posting || (!newPost.trim() && !postImage)}
                  className="gap-2"
                >
                  {posting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  פרסם
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        ) : trades.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              אין פוסטים עדיין
            </h3>
            <p className="text-muted-foreground">
              היה הראשון לשתף בקהילה!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <Card key={trade.id} className="bg-card border-border overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedProfileUserId(trade.user_id)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={trade.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(trade.profiles)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">
                          {getUserDisplayName(trade.profiles)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{trade.profiles?.username || 'user'} · {formatTimeAgo(trade.created_at)}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePost(trade.id)}
                        disabled={deletingPost === trade.id}
                      >
                        {deletingPost === trade.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Post Content */}
                  {trade.notes && (
                    <p className="mt-3 text-foreground whitespace-pre-wrap">
                      {trade.notes}
                    </p>
                  )}
                </div>

                {/* Post Image */}
                {trade.screenshot_url && (
                  <div className="border-y border-border">
                    <img
                      src={trade.screenshot_url}
                      alt="Trade screenshot"
                      className="w-full max-h-[500px] object-contain bg-black/5"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="p-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <Share2 className="h-4 w-4" />
                        שתף
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleComments(trade.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        {trade.comments_count}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1.5 ${trade.is_liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
                        onClick={() => handleLike(trade.id, trade.is_liked)}
                      >
                        <Heart className={`h-4 w-4 ${trade.is_liked ? 'fill-current' : ''}`} />
                        {trade.likes_count}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedComments === trade.id && (
                  <div className="border-t border-border bg-muted/30">
                    <div className="p-4 space-y-4">
                      <p className="text-sm font-medium text-muted-foreground">תגובות נוספות</p>
                      
                      {loadingComments === trade.id ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {/* Existing Comments */}
                          {comments[trade.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles?.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(comment.profiles)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-foreground">
                                    {getUserDisplayName(comment.profiles)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                                <button className="text-xs text-muted-foreground hover:text-primary mt-1">
                                  לייק · השב
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Add Comment Input */}
                          {user && (
                            <div className="flex gap-3 pt-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {getInitials(null)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Input
                                  placeholder="כתיבת תגובה..."
                                  value={newComment[trade.id] || ""}
                                  onChange={(e) => setNewComment(prev => ({
                                    ...prev,
                                    [trade.id]: e.target.value
                                  }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddComment(trade.id);
                                    }
                                  }}
                                  className="bg-background"
                                />
                                <Button
                                  size="icon"
                                  onClick={() => handleAddComment(trade.id)}
                                  disabled={!newComment[trade.id]?.trim()}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Public Profile Dialog */}
        <PublicProfileDialog
          userId={selectedProfileUserId || ""}
          open={!!selectedProfileUserId}
          onOpenChange={(open) => !open && setSelectedProfileUserId(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Community;
