import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Headphones } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

interface Conversation {
  id: string;
  guestName: string;
  lastMessageAt: string | null;
  unreadCount: number;
  channelKey: string;
  channelName: string;
  listingName: string;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
}

interface SupportThread {
  userId: string;
  userName: string;
  userEmail: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  messageCount: number;
}

interface ChatMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  sentAt: string | null;
}

type TabType = "channels" | "support";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

export default function AdminChat() {
  const [activeTab, setActiveTab] = useState<TabType>("support");
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedSupportUserId, setSelectedSupportUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: conversations, isLoading: convLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/admin/conversations"],
  });

  const { data: supportThreads, isLoading: supportLoading } = useQuery<SupportThread[]>({
    queryKey: ["/api/admin/support-threads"],
    refetchInterval: 5000,
  });

  const { data: channelMessages, isLoading: channelMsgLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/admin/conversations", selectedConvId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/conversations/${selectedConvId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedConvId && activeTab === "channels",
  });

  const { data: supportMessages, isLoading: supportMsgLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/admin/support-threads", selectedSupportUserId, "messages"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/support-threads/${selectedSupportUserId}/messages`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedSupportUserId && activeTab === "support",
    refetchInterval: 5000,
  });

  const sendChannelMutation = useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const res = await apiRequest("POST", `/api/admin/conversations/${conversationId}/send`, { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations", selectedConvId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/conversations"] });
      setMessageText("");
    },
  });

  const sendSupportMutation = useMutation({
    mutationFn: async ({ userId, body }: { userId: string; body: string }) => {
      const res = await apiRequest("POST", `/api/admin/support-threads/${userId}/send`, { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-threads", selectedSupportUserId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support-threads"] });
      setMessageText("");
    },
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    if (activeTab === "channels" && selectedConvId) {
      sendChannelMutation.mutate({ conversationId: selectedConvId, body: messageText.trim() });
    } else if (activeTab === "support" && selectedSupportUserId) {
      sendSupportMutation.mutate({ userId: selectedSupportUserId, body: messageText.trim() });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const selectedConversation = conversations?.find((c) => c.id === selectedConvId);
  const selectedSupportThread = supportThreads?.find((t) => t.userId === selectedSupportUserId);

  const messages = activeTab === "channels" ? channelMessages : supportMessages;
  const msgLoading = activeTab === "channels" ? channelMsgLoading : supportMsgLoading;
  const hasSelection = activeTab === "channels" ? !!selectedConvId : !!selectedSupportUserId;

  function getConversationDisplayName(conv: Conversation): string {
    return conv.guestName || "Guest";
  }

  function getConversationSubline(conv: Conversation): string {
    const parts = [conv.channelName, conv.listingName].filter(Boolean);
    return parts.join(" - ");
  }

  const totalSupportUnread = supportThreads?.reduce((sum, t) => sum + t.unreadCount, 0) ?? 0;

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="w-80 border-r flex flex-col flex-shrink-0">
        <div className="p-3 border-b">
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={activeTab === "support" ? "default" : "ghost"}
              onClick={() => { setActiveTab("support"); setSelectedConvId(null); }}
              className="flex-1 relative"
              data-testid="tab-support"
            >
              <Headphones className="h-3.5 w-3.5 mr-1.5" />
              Support
              {totalSupportUnread > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{totalSupportUnread}</Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant={activeTab === "channels" ? "default" : "ghost"}
              onClick={() => { setActiveTab("channels"); setSelectedSupportUserId(null); }}
              className="flex-1"
              data-testid="tab-channels"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              Channels
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "support" ? (
            supportLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : supportThreads && supportThreads.length > 0 ? (
              supportThreads.map((thread) => {
                const initials = getInitials(thread.userName);
                const isSelected = selectedSupportUserId === thread.userId;

                return (
                  <div
                    key={thread.userId}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b ${
                      isSelected ? "bg-sidebar-accent" : ""
                    }`}
                    onClick={() => setSelectedSupportUserId(thread.userId)}
                    data-testid={`support-thread-${thread.userId}`}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{thread.userName}</p>
                        {thread.unreadCount > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5">{thread.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {thread.userEmail || "Support chat"}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Headphones className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No support conversations</p>
              </div>
            )
          ) : (
            convLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => {
                const displayName = getConversationDisplayName(conv);
                const initials = getInitials(displayName);
                const isSelected = selectedConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b ${
                      isSelected ? "bg-sidebar-accent" : ""
                    }`}
                    onClick={() => setSelectedConvId(conv.id)}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <Avatar className="h-9 w-9 flex-shrink-0">
                      <AvatarFallback className="text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate" data-testid={`text-conv-name-${conv.id}`}>
                          {displayName}
                        </p>
                        {conv.unreadCount > 0 && (
                          <Badge variant="default" className="text-[10px] px-1.5" data-testid={`badge-unread-${conv.id}`}>
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {getConversationSubline(conv)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center" data-testid="text-no-conversations">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No conversations</p>
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {hasSelection ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs font-semibold">
                  {activeTab === "channels" && selectedConversation
                    ? getInitials(getConversationDisplayName(selectedConversation))
                    : selectedSupportThread
                    ? getInitials(selectedSupportThread.userName)
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold" data-testid="text-chat-user-name">
                  {activeTab === "channels" && selectedConversation
                    ? getConversationDisplayName(selectedConversation)
                    : selectedSupportThread?.userName || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "channels" && selectedConversation
                    ? getConversationSubline(selectedConversation)
                    : selectedSupportThread?.userEmail || "Support chat"}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {msgLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-2/3 rounded-md" />
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                messages.map((msg) => {
                  const isOutbound = msg.direction === "OUTBOUND";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <Card
                        className={`max-w-[70%] p-3 ${
                          isOutbound ? "bg-primary text-primary-foreground" : ""
                        }`}
                      >
                        <p className="text-sm">{msg.body}</p>
                        {msg.sentAt && (
                          <p
                            className={`text-[10px] mt-1 ${
                              isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {format(new Date(msg.sentAt), "MMM d, h:mm a")}
                          </p>
                        )}
                      </Card>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full" data-testid="text-no-messages">
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  data-testid="input-chat-message"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!messageText.trim() || sendChannelMutation.isPending || sendSupportMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" data-testid="text-select-conversation">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
