import { useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const pinnedMessages = messages.filter((m) => m.is_pinned);
  const displayedMessages = showPinnedOnly ? pinnedMessages : messages;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && !showPinnedOnly) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showPinnedOnly]);

  const handleReaction = (messageId: string, emoji: string, hasReacted: boolean) => {
    onReaction(messageId, emoji, hasReacted);
  };

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
      <ScrollArea ref={scrollRef} className="flex-1">
        <div className="py-4">
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
            displayedMessages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.user_id === user?.id}
                isAdmin={isAdmin}
                onDelete={onDeleteMessage}
                onPin={onPinMessage}
                onReply={setReplyTo}
                onReaction={handleReaction}
              />
            ))
          )}
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
