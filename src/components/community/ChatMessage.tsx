import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import {
  Pin,
  MoreHorizontal,
  Trash2,
  Reply,
  Smile,
  TrendingUp,
  TrendingDown,
  CornerDownRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CommunityMessage } from "@/hooks/useCommunity";
import { cn } from "@/lib/utils";
import { TradeDetailsDialog } from "./TradeDetailsDialog";

interface ChatMessageProps {
  message: CommunityMessage;
  isOwn: boolean;
  isAdmin: boolean;
  onDelete: (messageId: string) => void;
  onPin: (messageId: string, isPinned: boolean) => void;
  onReply: (message: CommunityMessage) => void;
  onReaction: (messageId: string, emoji: string, hasReacted: boolean) => void;
  replyToMessage?: CommunityMessage | null;
  onScrollToMessage?: (messageId: string) => void;
}

const EMOJI_OPTIONS = ["👍", "❤️", "🔥", "🚀", "💰", "📈", "📉", "🎯"];

export const ChatMessage = ({
  message,
  isOwn,
  isAdmin,
  onDelete,
  onPin,
  onReply,
  onReaction,
  replyToMessage,
  onScrollToMessage,
}: ChatMessageProps) => {
  const [showActions, setShowActions] = useState(false);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);

  const getDisplayName = () => {
    if (message.profile?.first_name || message.profile?.last_name) {
      return `${message.profile.first_name || ""} ${message.profile.last_name || ""}`.trim();
    }
    return message.profile?.username || "משתמש אנונימי";
  };

  const getReplyDisplayName = () => {
    if (!replyToMessage?.profile) return "משתמש אנונימי";
    if (replyToMessage.profile.first_name || replyToMessage.profile.last_name) {
      return `${replyToMessage.profile.first_name || ""} ${replyToMessage.profile.last_name || ""}`.trim();
    }
    return replyToMessage.profile.username || "משתמש אנונימי";
  };

  const getInitials = () => {
    if (message.profile?.first_name) {
      return message.profile.first_name.charAt(0).toUpperCase();
    }
    if (message.profile?.username) {
      return message.profile.username.charAt(0).toUpperCase();
    }
    return "?";
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: he });
  };

  return (
    <>
      <div
        id={`message-${message.id}`}
        className={cn(
          "group relative flex gap-3 px-4 py-2 hover:bg-muted/30 transition-colors",
          message.is_pinned && "bg-yellow-500/5 border-r-2 border-yellow-500"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Avatar */}
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={message.profile?.avatar_url || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{getDisplayName()}</span>
            {message.is_pinned && (
              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs py-0">
                <Pin className="h-3 w-3 mr-1" />
                נעוץ
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
            {message.is_edited && (
              <span className="text-xs text-muted-foreground">(נערך)</span>
            )}
          </div>

          {/* Reply Reference */}
          {replyToMessage && (
            <button
              onClick={() => onScrollToMessage?.(replyToMessage.id)}
              className="flex items-center gap-2 mt-1 text-xs text-muted-foreground bg-muted/50 hover:bg-muted rounded px-2 py-1 max-w-sm cursor-pointer transition-colors"
            >
              <CornerDownRight className="h-3 w-3 shrink-0" />
              <span className="font-medium">{getReplyDisplayName()}</span>
              <span className="truncate">
                {replyToMessage.content || (replyToMessage.trade ? "שיתף עסקה" : "קובץ")}
              </span>
            </button>
          )}

          {/* Trade Card */}
          {message.trade && (
            <div 
              className="mt-2 p-3 bg-card rounded-lg border max-w-sm cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setTradeDialogOpen(true)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={message.trade.trade_type === "long" ? "default" : "destructive"}>
                    {message.trade.trade_type === "long" ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {message.trade.trade_type.toUpperCase()}
                  </Badge>
                  <span className="font-semibold">{message.trade.symbol}</span>
                </div>
                {message.trade.pnl !== null && (
                  <span
                    className={cn(
                      "font-bold",
                      message.trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                    )}
                  >
                    {message.trade.pnl >= 0 ? "+" : ""}
                    ${message.trade.pnl.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>כניסה: ${message.trade.entry_price}</span>
                  {message.trade.exit_price && (
                    <span>יציאה: ${message.trade.exit_price}</span>
                  )}
                </div>
                {message.trade.strategy && (
                  <div className="mt-1">אסטרטגיה: {message.trade.strategy}</div>
                )}
              </div>
              <div className="mt-2 text-xs text-primary">לחץ לפרטים מלאים →</div>
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="text-foreground mt-1 whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* File */}
          {message.file_url && (
            <div className="mt-2">
              {message.file_type?.startsWith("image/") ? (
                <img
                  src={message.file_url}
                  alt={message.file_name || "Uploaded image"}
                  className="max-w-md max-h-64 rounded-lg object-cover cursor-pointer hover:opacity-90"
                />
              ) : (
                <a
                  href={message.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:bg-muted/80"
                >
                  📎 {message.file_name || "קובץ"}
                </a>
              )}
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {message.reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => onReaction(message.id, reaction.emoji, reaction.user_reacted)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors",
                    reaction.user_reacted
                      ? "bg-primary/20 text-primary"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="absolute left-4 top-2 flex items-center gap-1 bg-card border rounded-md shadow-sm p-0.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(message.id, emoji, false)}
                      className="text-lg hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReply(message)}>
              <Reply className="h-4 w-4" />
            </Button>

            {(isOwn || isAdmin) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => onPin(message.id, message.is_pinned)}>
                      <Pin className="h-4 w-4 mr-2" />
                      {message.is_pinned ? "הסר נעיצה" : "נעץ הודעה"}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    מחק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>

      {/* Trade Details Dialog */}
      {message.trade && (
        <TradeDetailsDialog
          trade={message.trade}
          open={tradeDialogOpen}
          onOpenChange={setTradeDialogOpen}
        />
      )}
    </>
  );
};
