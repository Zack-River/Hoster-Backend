import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Send,
} from "lucide-react";

interface ChatMsg {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  sentAt: string | null;
}

export default function SupportChatPage() {
  const [, setLocation] = useLocation();
  const [chatMessage, setChatMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<ChatMsg[]>({
    queryKey: ["/api/support/messages"],
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", "/api/support/send", { body });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages"] });
      setChatMessage("");
    },
  });

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    sendMutation.mutate(chatMessage.trim());
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayMessages = messages && messages.length > 0 ? messages : [];
  const showWelcome = !isLoading && displayMessages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-50">
        <button
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
          onClick={() => setLocation("/settings")}
          data-testid="button-back-chat"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go back</span>
        </button>
        <h1 className="text-lg font-semibold" data-testid="text-chat-title">Chat with Us</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-messages-container">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-2/3 rounded-md" />
            ))}
          </div>
        ) : (
          <>
            {showWelcome && (
              <div className="flex justify-start">
                <div
                  className="max-w-[80%] px-3 py-2 rounded-md text-sm leading-relaxed bg-muted"
                  data-testid="chat-welcome-message"
                >
                  Welcome to Hoster support! How can we help you today?
                </div>
              </div>
            )}
            {displayMessages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === "INBOUND" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-md text-sm leading-relaxed ${
                    msg.direction === "INBOUND"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                  data-testid={`chat-message-${i}`}
                >
                  {msg.body}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 border-t bg-background">
        <Input
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendChat();
            }
          }}
          data-testid="input-chat-message"
        />
        <Button
          size="icon"
          onClick={handleSendChat}
          disabled={!chatMessage.trim() || sendMutation.isPending}
          data-testid="button-send-chat"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
