import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChannelSidebar } from "@/components/community/ChannelSidebar";
import { ChatArea } from "@/components/community/ChatArea";
import { OnlineUsersList } from "@/components/community/OnlineUsersList";
import { useCommunity } from "@/hooks/useCommunity";
import { Loader2 } from "lucide-react";

const Community = () => {
  const [showUserList, setShowUserList] = useState(true);
  const {
    channels,
    activeChannel,
    setActiveChannel,
    messages,
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
  } = useCommunity();

  const handleReaction = (messageId: string, emoji: string, hasReacted: boolean) => {
    if (hasReacted) {
      removeReaction(messageId, emoji);
    } else {
      addReaction(messageId, emoji);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-80px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] flex flex-col md:flex-row mt-8 md:mt-0" dir="rtl">
        {/* Channel Sidebar - Hidden on mobile by default */}
        <div className="hidden md:block">
          <ChannelSidebar
            channels={channels}
            activeChannel={activeChannel}
            onChannelSelect={setActiveChannel}
            onCreateChannel={createChannel}
            onDeleteChannel={deleteChannel}
            isAdmin={isAdmin}
            canManageChannels={isAdmin || isModerator}
          />
        </div>

        {/* Mobile Channel Selector */}
        <div className="md:hidden px-2 py-2 border-b border-border bg-card">
          <select
            className="w-full p-2 rounded-lg bg-muted text-foreground border border-border"
            value={activeChannel?.id || ""}
            onChange={(e) => {
              const channel = channels.find(c => c.id === e.target.value);
              if (channel) setActiveChannel(channel);
            }}
          >
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </div>

        {/* Main Chat Area */}
        <ChatArea
          channel={activeChannel}
          messages={messages}
          loading={messagesLoading}
          isAdmin={isAdmin}
          onDeleteMessage={deleteMessage}
          onPinMessage={togglePin}
          onReaction={handleReaction}
          onSendMessage={sendMessage}
          onToggleUserList={() => setShowUserList(!showUserList)}
          showUserList={showUserList}
        />

        {/* Online Users - Hidden on mobile */}
        {showUserList && <div className="hidden md:block"><OnlineUsersList channel={activeChannel} /></div>}
      </div>
    </DashboardLayout>
  );
};

export default Community;
