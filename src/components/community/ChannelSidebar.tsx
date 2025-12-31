import { useState } from "react";
import { Hash, Megaphone, TrendingUp, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Channel } from "@/hooks/useCommunity";
import { cn } from "@/lib/utils";

interface ChannelSidebarProps {
  channels: Channel[];
  activeChannel: Channel | null;
  onChannelSelect: (channel: Channel) => void;
  onCreateChannel: (name: string, description: string, icon: string, type: "text" | "announcements" | "trades") => Promise<any>;
  onDeleteChannel: (channelId: string) => Promise<void>;
  isAdmin: boolean;
  canManageChannels: boolean;
}

const getChannelIcon = (type: string, icon: string) => {
  if (icon && icon.length <= 2) {
    return <span className="text-base">{icon}</span>;
  }
  
  switch (type) {
    case "announcements":
      return <Megaphone className="h-4 w-4" />;
    case "trades":
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Hash className="h-4 w-4" />;
  }
};

export const ChannelSidebar = ({
  channels,
  activeChannel,
  onChannelSelect,
  onCreateChannel,
  onDeleteChannel,
  isAdmin,
  canManageChannels,
}: ChannelSidebarProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    description: "",
    icon: "💬",
    type: "text" as "text" | "announcements" | "trades",
  });
  const [creating, setCreating] = useState(false);

  const handleCreateChannel = async () => {
    if (!newChannel.name.trim()) return;
    
    setCreating(true);
    try {
      await onCreateChannel(
        newChannel.name,
        newChannel.description,
        newChannel.icon,
        newChannel.type
      );
      setNewChannel({ name: "", description: "", icon: "💬", type: "text" });
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Error creating channel:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-60 bg-card/50 border-l border-border flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4">
        <h2 className="font-semibold text-foreground">קהילת סוחרים</h2>
        {canManageChannels && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>צור חדר חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>שם החדר</Label>
                  <Input
                    value={newChannel.name}
                    onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                    placeholder="לדוגמה: ניתוחים יומיים"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea
                    value={newChannel.description}
                    onChange={(e) => setNewChannel({ ...newChannel, description: e.target.value })}
                    placeholder="מה הנושא של החדר?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>אייקון</Label>
                    <Input
                      value={newChannel.icon}
                      onChange={(e) => setNewChannel({ ...newChannel, icon: e.target.value })}
                      placeholder="💬"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>סוג</Label>
                    <Select
                      value={newChannel.type}
                      onValueChange={(value: "text" | "announcements" | "trades") =>
                        setNewChannel({ ...newChannel, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">טקסט</SelectItem>
                        <SelectItem value="announcements">הודעות</SelectItem>
                        <SelectItem value="trades">עסקאות</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleCreateChannel}
                  disabled={!newChannel.name.trim() || creating}
                  className="w-full"
                >
                  {creating ? "יוצר..." : "צור חדר"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Channels List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer transition-colors",
                activeChannel?.id === channel.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onChannelSelect(channel)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 text-muted-foreground">
                  {getChannelIcon(channel.channel_type, channel.icon)}
                </span>
                <span className="truncate text-sm">{channel.name}</span>
              </div>
              
              {canManageChannels && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChannel(channel.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      מחק חדר
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
