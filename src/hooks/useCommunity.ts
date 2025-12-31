import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

export interface Channel {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  channel_type: "text" | "announcements" | "trades";
  position: number;
  is_default: boolean;
}

export interface CommunityMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null;
  file_name: string | null;
  trade_id: string | null;
  reply_to_id: string | null;
  is_pinned: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  reply_to?: CommunityMessage | null;
  reactions?: { emoji: string; count: number; user_reacted: boolean }[];
  trade?: {
    id: string;
    symbol: string;
    trade_type: string;
    entry_price: number;
    exit_price: number | null;
    pnl: number | null;
    strategy: string | null;
    screenshot_url: string | null;
    entry_date?: string | null;
    exit_date?: string | null;
    quantity?: number;
    notes?: string | null;
    rr?: number | null;
    commission?: number | null;
  } | null;
}

export interface OnlineUser {
  user_id: string;
  channel_id: string;
  last_seen: string;
  is_typing: boolean;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export const useCommunity = () => {
  const { user } = useAuth();
  const { isAdmin, isModerator } = useUserRole();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_channels")
        .select("*")
        .order("position");

      if (error) throw error;

      const typedChannels = (data || []).map(ch => ({
        ...ch,
        channel_type: ch.channel_type as "text" | "announcements" | "trades"
      }));

      setChannels(typedChannels);

      // Set default channel if none active
      if (!activeChannel && typedChannels.length > 0) {
        const defaultChannel = typedChannels.find((c) => c.is_default) || typedChannels[0];
        setActiveChannel(defaultChannel);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  }, [activeChannel]);

  // Fetch messages for active channel
  const fetchMessages = useCallback(async (channelId: string) => {
    setMessagesLoading(true);
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("community_messages")
        .select("*")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(messagesData.map((m) => m.user_id))];
      const tradeIds = messagesData.filter((m) => m.trade_id).map((m) => m.trade_id);
      const messageIds = messagesData.map((m) => m.id);

      // Fetch profiles, trades, and reactions in parallel
      const [profilesResult, tradesResult, reactionsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, first_name, last_name, username, avatar_url")
          .in("user_id", userIds),
        tradeIds.length > 0
          ? supabase
              .from("trades")
              .select(
                "id, symbol, trade_type, entry_price, exit_price, pnl, strategy, screenshot_url, entry_date, exit_date, quantity, notes, rr, commission"
              )
              .in("id", tradeIds)
          : { data: [] },
        supabase.from("message_reactions").select("*").in("message_id", messageIds),
      ]);

      const profilesMap = new Map<string, any>();
      for (const p of profilesResult.data || []) {
        profilesMap.set(p.user_id, p);
      }
      
      const tradesMap = new Map<string, any>();
      for (const t of tradesResult.data || []) {
        tradesMap.set(t.id, t);
      }

      // Group reactions
      const reactionsMap = new Map<string, { emoji: string; count: number; user_reacted: boolean }[]>();
      for (const reaction of reactionsResult.data || []) {
        const existing = reactionsMap.get(reaction.message_id) || [];
        const emojiEntry = existing.find((e) => e.emoji === reaction.emoji);
        if (emojiEntry) {
          emojiEntry.count++;
          if (reaction.user_id === user?.id) emojiEntry.user_reacted = true;
        } else {
          existing.push({
            emoji: reaction.emoji,
            count: 1,
            user_reacted: reaction.user_id === user?.id,
          });
        }
        reactionsMap.set(reaction.message_id, existing);
      }

      const enrichedMessages: CommunityMessage[] = messagesData.map((msg) => ({
        ...msg,
        profile: profilesMap.get(msg.user_id) || null,
        trade: msg.trade_id ? tradesMap.get(msg.trade_id) : null,
        reactions: reactionsMap.get(msg.id) || [],
      }));

      setMessages(enrichedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  }, [user?.id]);

  // Send message
  const sendMessage = useCallback(
    async (content: string, fileUrl?: string, fileType?: string, fileName?: string, tradeId?: string, replyToId?: string) => {
      if (!user || !activeChannel) return;

      try {
        const { data, error } = await supabase
          .from("community_messages")
          .insert({
            channel_id: activeChannel.id,
            user_id: user.id,
            content: content || null,
            file_url: fileUrl || null,
            file_type: fileType || null,
            file_name: fileName || null,
            trade_id: tradeId || null,
            reply_to_id: replyToId || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Message will be added via realtime subscription
        return data;
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      }
    },
    [user, activeChannel]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        const { error } = await supabase.from("community_messages").delete().eq("id", messageId);

        if (error) throw error;

        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
      }
    },
    []
  );

  // Toggle pin
  const togglePin = useCallback(
    async (messageId: string, isPinned: boolean) => {
      if (!isAdmin) return;

      try {
        const { error } = await supabase
          .from("community_messages")
          .update({ is_pinned: !isPinned })
          .eq("id", messageId);

        if (error) throw error;

        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, is_pinned: !isPinned } : m))
        );
      } catch (error) {
        console.error("Error toggling pin:", error);
        throw error;
      }
    },
    [isAdmin]
  );

  // Add reaction
  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;

      try {
        const { error } = await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });

        if (error) throw error;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const existing = reactions.find((r) => r.emoji === emoji);
            if (existing) {
              existing.count++;
              existing.user_reacted = true;
            } else {
              reactions.push({ emoji, count: 1, user_reacted: true });
            }
            return { ...m, reactions };
          })
        );
      } catch (error) {
        console.error("Error adding reaction:", error);
      }
    },
    [user]
  );

  // Remove reaction
  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);

        if (error) throw error;

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = (m.reactions || [])
              .map((r) => {
                if (r.emoji !== emoji) return r;
                return { ...r, count: r.count - 1, user_reacted: false };
              })
              .filter((r) => r.count > 0);
            return { ...m, reactions };
          })
        );
      } catch (error) {
        console.error("Error removing reaction:", error);
      }
    },
    [user]
  );

  // Create channel (admin/moderator)
  const createChannel = useCallback(
    async (name: string, description: string, icon: string, channelType: "text" | "announcements" | "trades") => {
      if (!isAdmin && !isModerator) return;

      try {
        const { data, error } = await supabase
          .from("community_channels")
          .insert({
            name,
            description,
            icon,
            channel_type: channelType,
            position: channels.length,
          })
          .select()
          .single();

        if (error) throw error;

        setChannels((prev) => [...prev, { ...data, channel_type: data.channel_type as "text" | "announcements" | "trades" }]);
        return data;
      } catch (error) {
        console.error("Error creating channel:", error);
        throw error;
      }
    },
    [isAdmin, isModerator, channels.length]
  );

  // Delete channel (admin/moderator)
  const deleteChannel = useCallback(
    async (channelId: string) => {
      if (!isAdmin && !isModerator) return;

      try {
        const { error } = await supabase.from("community_channels").delete().eq("id", channelId);

        if (error) throw error;

        setChannels((prev) => prev.filter((c) => c.id !== channelId));

        if (activeChannel?.id === channelId) {
          const remaining = channels.filter((c) => c.id !== channelId);
          setActiveChannel(remaining[0] || null);
        }
      } catch (error) {
        console.error("Error deleting channel:", error);
        throw error;
      }
    },
    [isAdmin, isModerator, activeChannel, channels]
  );

  // Initial fetch
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
    }
  }, [activeChannel, fetchMessages]);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!activeChannel) return;

    const channel = supabase
      .channel(`messages-${activeChannel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `channel_id=eq.${activeChannel.id}`,
        },
        async (payload) => {
          // Don't duplicate if we already have this message
          if (messages.some((m) => m.id === payload.new.id)) return;

          // Fetch profile for the new message
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, first_name, last_name, username, avatar_url")
            .eq("user_id", payload.new.user_id)
            .single();

          // Fetch trade (if attached)
          const tradeId = (payload.new as any).trade_id as string | null | undefined;
          const { data: trade } = tradeId
            ? await supabase
                .from("trades")
                .select(
                  "id, symbol, trade_type, entry_price, exit_price, pnl, strategy, screenshot_url, entry_date, exit_date, quantity, notes, rr, commission"
                )
                .eq("id", tradeId)
                .maybeSingle()
            : { data: null as any };

          const newMessage: CommunityMessage = {
            ...(payload.new as any),
            profile,
            trade: trade || null,
            reactions: [],
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_messages",
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, messages]);

  return {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
    onlineUsers,
    loading,
    messagesLoading,
    sendMessage,
    deleteMessage,
    togglePin,
    addReaction,
    removeReaction,
    createChannel,
    deleteChannel,
    isAdmin,
    isModerator,
    fetchChannels,
  };
};
