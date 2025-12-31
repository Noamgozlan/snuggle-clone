import { useEffect, useRef, useState, useCallback } from "react";
import { Hash, Pin, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Channel, CommunityMessage } from "@/hooks/useCommunity";
import { useAuth } from "@/contexts/AuthContext";

interface ChatAreaProps {
  channel: Channel | null;
  messages: CommunityMessage[];
  loading: boolean;
  isAdmin: boolean;
  onDeleteMessage: (messageId: string) => void;
  onPinMessage: (messageId: string, isPinned: boolean) => void;
  onReaction: (messageId: string, emoji: string, hasReacted: boolean) => void;
  onSendMessage: (
    content: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string,
    tradeId?: string,
    replyToId?: string
  ) => Promise<any>;
  onToggleUserList: () => void;
  showUserList: boolean;
}

export const ChatArea = ({
  channel,
  messages,
  loading,
  isAdmin,
  onDeleteMessage,
  onPinMessage,
  onReaction,
  onSendMessage,
  onToggleUserList,
  showUserList,
}: ChatAreaProps) => {
  const { user } = useAuth();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const prevChannelId = useRef<string | null>(null);

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const displayedMessages = showPinnedOnly ? pinnedMessages : messages;

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  // Scroll to bottom on channel change or initial load
  useEffect(() => {
    if (channel?.id && channel.id !== prevChannelId.current) {
      prevChannelId.current = channel.id;
      setHasInitialScrolled(false);
    }
  }, [channel?.id]);

  // Scroll to bottom when messages load for the first time
  useEffect(() => {
    if (!loading && messages.length > 0 && !hasInitialScrolled && !showPinnedOnly) {
      // Use a small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        scrollToBottom("auto");
        setHasInitialScrolled(true);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loading, messages.length, hasInitialScrolled, showPinnedOnly, scrollToBottom]);

  // Scroll to bottom on new messages (only if already at bottom)
  useEffect(() => {
    if (hasInitialScrolled && !showPinnedOnly && messagesEndRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length, hasInitialScrolled, showPinnedOnly, scrollToBottom]);

  const handleReaction = (messageId: string, emoji: string, hasReacted: boolean) => {
    onReaction(messageId, emoji, hasReacted);
  };

  const handleScrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        בחר חדר כדי להתחיל
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Channel Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/30">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">{channel.name}</span>
          {channel.description && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-sm text-muted-foreground truncate max-w-md">
                {channel.description}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pinnedMessages.length > 0 && (
            <Button
              variant={showPinnedOnly ? "secondary" : "ghost"}
              size="sm"
              className="gap-2"
              onClick={() => setShowPinnedOnly(!showPinnedOnly)}
            >
              <Pin className="h-4 w-4" />
              {pinnedMessages.length}
            </Button>
          )}
          <Button
            variant={showUserList ? "secondary" : "ghost"}
            size="icon"
            onClick={onToggleUserList}
          >
            <Users className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="py-4" ref={scrollContainerRef}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : displayedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Hash className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {showPinnedOnly ? "אין הודעות נעוצות" : `ברוכים הבאים ל-#${channel.name}!`}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {showPinnedOnly
                  ? "עדיין אין הודעות נעוצות בחדר הזה"
                  : "זו ההתחלה של החדר הזה. תהיו הראשונים לשלוח הודעה!"}
              </p>
            </div>
          ) : (
            displayedMessages.map((message) => {
              const replyToMessage = message.reply_to_id 
                ? messages.find(m => m.id === message.reply_to_id) 
                : null;
              return (
                <div
                  key={message.id}
                  className={highlightedMessageId === message.id ? "animate-pulse bg-primary/10 rounded" : ""}
                >
                  <ChatMessage
                    message={message}
                    isOwn={message.user_id === user?.id}
                    isAdmin={isAdmin}
                    onDelete={onDeleteMessage}
                    onPin={onPinMessage}
                    onReply={setReplyTo}
                    onReaction={handleReaction}
                    replyToMessage={replyToMessage}
                    onScrollToMessage={handleScrollToMessage}
                  />
                </div>
              );
            })
          )}
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        channelId={channel.id}
        channelName={channel.name}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};
