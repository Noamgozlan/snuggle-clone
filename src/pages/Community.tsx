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
      <div className="h-[calc(100vh-80px)] flex" dir="rtl">
        {/* Channel Sidebar */}
        <ChannelSidebar
          channels={channels}
          activeChannel={activeChannel}
          onChannelSelect={setActiveChannel}
          onCreateChannel={createChannel}
          onDeleteChannel={deleteChannel}
          isAdmin={isAdmin}
        />

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

        {/* Online Users */}
        {showUserList && <OnlineUsersList channel={activeChannel} />}
      </div>
    </DashboardLayout>
  );
};

export default Community;
