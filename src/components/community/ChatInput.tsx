import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, X, Smile, BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { CommunityMessage } from "@/hooks/useCommunity";
import { ShareTradeDialog } from "./ShareTradeDialog";
import { cn } from "@/lib/utils";

interface SelectedTrade {
  id: string;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  strategy: string | null;
  screenshot_url: string | null;
}

interface ChatInputProps {
  channelId: string;
  channelName: string;
  replyTo: CommunityMessage | null;
  onClearReply: () => void;
  onSendMessage: (
    content: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string,
    tradeId?: string,
    replyToId?: string
  ) => Promise<any>;
}

const EMOJI_QUICK = ["👍", "❤️", "🔥", "🚀", "💰", "📈", "📉", "🎯", "💪", "👏"];

export const ChatInput = ({
  channelId,
  channelName,
  replyTo,
  onClearReply,
  onSendMessage,
}: ChatInputProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<SelectedTrade | null>(null);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearTrade = () => {
    setSelectedTrade(null);
  };

  const handleSend = async () => {
    if (!user || (!content.trim() && !file && !selectedTrade)) return;

    setSending(true);
    try {
      let fileUrl: string | undefined;
      let fileType: string | undefined;
      let fileName: string | undefined;

      // Upload file if exists
      if (file) {
        setUploading(true);
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("trade-screenshots")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("trade-screenshots")
          .getPublicUrl(filePath);

        fileUrl = publicUrlData.publicUrl;
        fileType = file.type;
        fileName = file.name;
        setUploading(false);
      }

      await onSendMessage(
        content.trim(),
        fileUrl,
        fileType,
        fileName,
        selectedTrade?.id,
        replyTo?.id
      );

      setContent("");
      clearFile();
      clearTrade();
      onClearReply();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const getReplyToName = () => {
    if (replyTo?.profile?.first_name || replyTo?.profile?.last_name) {
      return `${replyTo.profile.first_name || ""} ${replyTo.profile.last_name || ""}`.trim();
    }
    return replyTo?.profile?.username || "משתמש";
  };

  return (
    <div className="border-t border-border p-4 bg-card/30">
      {/* Reply Preview */}
      {replyTo && (
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 mb-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">מגיב ל:</span>
            <span className="font-medium">{getReplyToName()}</span>
            <span className="text-muted-foreground truncate max-w-xs">
              {replyTo.content?.slice(0, 50)}...
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClearReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Selected Trade Preview */}
      {selectedTrade && (
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2 mb-2">
          <div className="flex items-center gap-2 flex-1">
            <Badge
              variant={selectedTrade.trade_type === "long" ? "default" : "destructive"}
              className="text-xs"
            >
              {selectedTrade.trade_type === "long" ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {selectedTrade.trade_type.toUpperCase()}
            </Badge>
            <span className="font-semibold">{selectedTrade.symbol}</span>
            {selectedTrade.pnl !== null && (
              <span
                className={cn(
                  "font-bold text-sm",
                  selectedTrade.pnl >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {selectedTrade.pnl >= 0 ? "+" : ""}${selectedTrade.pnl.toFixed(2)}
              </span>
            )}
            {selectedTrade.strategy && (
              <Badge variant="outline" className="text-xs">
                {selectedTrade.strategy}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearTrade}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 mb-2">
          {filePreview ? (
            <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
          ) : (
            <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
              📎
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`הודעה ל-#${channelName}`}
            className="min-h-[44px] max-h-32 resize-none pr-28 bg-background"
            disabled={sending}
          />
          <div className="absolute left-2 bottom-2 flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowTradeDialog(true)}
              disabled={sending}
            >
              <BarChart2 className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={sending}>
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="flex flex-wrap gap-1 max-w-48">
                  {EMOJI_QUICK.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="text-xl hover:scale-125 transition-transform p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button
          onClick={handleSend}
          disabled={(!content.trim() && !file && !selectedTrade) || sending}
          className="h-[44px] px-4"
        >
          {sending ? (
            uploading ? (
              "מעלה..."
            ) : (
              "שולח..."
            )
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Share Trade Dialog */}
      <ShareTradeDialog
        open={showTradeDialog}
        onOpenChange={setShowTradeDialog}
        onSelectTrade={setSelectedTrade}
      />
    </div>
  );
};
