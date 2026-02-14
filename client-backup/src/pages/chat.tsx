import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelBadge } from "@/components/channel-icon";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import {
 ArrowLeft,
 Send,
 FileText,
 Loader2,
 CheckCheck,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { CHANNEL_INFO, type ChannelKey } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
 SheetTrigger,
} from "@/components/ui/sheet";

const AVATAR_COLORS = [
 "bg-rose-500/15 text-rose-700",
 "bg-teal-500/15 text-teal-700",
 "bg-emerald-500/15 text-emerald-700",
 "bg-amber-500/15 text-amber-700",
 "bg-violet-500/15 text-violet-700",
 "bg-lime-500/15 text-lime-700",
 "bg-pink-500/15 text-pink-700",
 "bg-orange-500/15 text-orange-700",
];

function getAvatarColor(name: string) {
 let hash = 0;
 for (let i = 0; i < name.length; i++) {
 hash = name.charCodeAt(i) + ((hash << 5) - hash);
 }
 return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ChatData {
 conversation: {
 id: string;
 guestName: string;
 channelKey: ChannelKey;
 channelName: string;
 listingName: string;
 checkIn: string | null;
 checkOut: string | null;
 };
 messages: Array<{
 id: string;
 direction: "INBOUND" | "OUTBOUND";
 body: string;
 sentAt: string;
 status?: "sending" | "sent" | "failed";
 }>;
 templates: Array<{
 id: string;
 name: string;
 body: string;
 }>;
}

function formatDateSeparator(dateStr: string): string {
 const date = parseISO(dateStr);
 if (isToday(date)) return "Today";
 if (isYesterday(date)) return "Yesterday";
 return format(date, "EEEE, MMM d");
}

function replaceTemplateVars(
 body: string,
 conversation: ChatData["conversation"]
): string {
 let result = body;
 result = result.replace(/\{guest_name\}/gi, conversation.guestName);
 result = result.replace(/\{listing_name\}/gi, conversation.listingName);
 if (conversation.checkIn) {
 result = result.replace(
 /\{check_in\}/gi,
 format(parseISO(conversation.checkIn), "MMM d, yyyy")
 );
 }
 if (conversation.checkOut) {
 result = result.replace(
 /\{check_out\}/gi,
 format(parseISO(conversation.checkOut), "MMM d, yyyy")
 );
 }
 return result;
}

export default function ChatPage() {
 const params = useParams<{ id: string }>();
 const conversationId = params.id;
 const [, setLocation] = useLocation();
 const [message, setMessage] = useState("");
 const [templateOpen, setTemplateOpen] = useState(false);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const { toast } = useToast();

 const { data, isLoading } = useQuery<ChatData>({
 queryKey: ["/api/chat", conversationId],
 });

 const sendMutation = useMutation({
 mutationFn: async (body: string) => {
 await apiRequest("POST", `/api/chat/${conversationId}/send`, { body });
 },
 onSuccess: () => {
 setMessage("");
 queryClient.invalidateQueries({
 queryKey: ["/api/chat", conversationId],
 });
 queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
 },
 onError: () => {
 toast({
 title: "Failed to send message",
 variant: "destructive",
 });
 },
 });

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [data?.messages]);

 const handleSend = () => {
 const trimmed = message.trim();
 if (!trimmed) return;
 sendMutation.mutate(trimmed);
 };

 const handleInsertTemplate = (body: string) => {
 if (data?.conversation) {
 setMessage(replaceTemplateVars(body, data.conversation));
 } else {
 setMessage(body);
 }
 setTemplateOpen(false);
 };

 if (isLoading) {
 return (
 <div className="flex flex-col h-full">
 <div className="p-4 border-b">
 <Skeleton className="h-8 w-48" />
 </div>
 <div className="flex-1 p-4 space-y-3">
 <Skeleton className="h-12 w-3/4" />
 <Skeleton className="ml-auto h-12 w-3/4" />
 <Skeleton className="h-12 w-2/3" />
 </div>
 </div>
 );
 }

 if (!data) {
 return (
 <div className="flex flex-col items-center justify-center h-full p-4 text-center">
 <p className="text-sm text-muted-foreground">Conversation not found</p>
 <Button
 variant="ghost"
 onClick={() => setLocation("/inbox")}
 className="mt-3"
 >
 Back to Inbox
 </Button>
 </div>
 );
 }

 const { conversation, messages: msgs, templates } = data;
 const guestInitials = conversation.guestName
 .split(" ")
 .map((n) => n[0])
 .join("")
 .toUpperCase();
 const avatarColor = getAvatarColor(conversation.guestName);
 const channelInfo = CHANNEL_INFO[conversation.channelKey];
 const canSendMessages = channelInfo?.permissions?.messagesWrite ?? true;

 let lastDateStr = "";

 return (
 <div className="flex flex-col h-full">
 <div className="flex-shrink-0 border-b bg-background px-4 py-3.5">
 <div className="flex items-center gap-3">
 <Button
 size="icon"
 variant="ghost"
 onClick={() => setLocation("/inbox")}
 data-testid="button-back"
 >
 <ArrowLeft className="h-4 w-4" />
 </Button>
 <Avatar className="h-8 w-8 flex-shrink-0">
 <AvatarFallback className={cn("text-xs font-semibold", avatarColor)}>
 {guestInitials}
 </AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <h1
 className="text-sm font-semibold truncate"
 data-testid="text-guest-name"
 >
 {conversation.guestName}
 </h1>
 <ChannelBadge channelKey={conversation.channelKey} />
 </div>
 <p className="text-xs text-muted-foreground truncate mt-0.5">
 {conversation.listingName}
 {conversation.checkIn && (
 <span>
 {" "}
 &middot; {format(parseISO(conversation.checkIn), "MMM d")}
 {conversation.checkOut && (
 <span> - {format(parseISO(conversation.checkOut), "MMM d")}</span>
 )}
 </span>
 )}
 </p>
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
 {msgs.length === 0 && (
 <div className="flex items-center justify-center py-16">
 <p className="text-xs text-muted-foreground">
 No messages yet
 </p>
 </div>
 )}
 {msgs.map((msg, idx) => {
 const msgDate = format(parseISO(msg.sentAt), "yyyy-MM-dd");
 let showDateSeparator = false;
 if (msgDate !== lastDateStr) {
 showDateSeparator = true;
 lastDateStr = msgDate;
 }

 return (
 <div key={msg.id}>
 {showDateSeparator && (
 <div className="flex items-center gap-3 my-3" data-testid={`date-separator-${msgDate}`}>
 <span className="flex-1 h-px bg-border" />
 <span className="text-xs text-muted-foreground font-medium px-2">
 {formatDateSeparator(msg.sentAt)}
 </span>
 <span className="flex-1 h-px bg-border" />
 </div>
 )}
 <div
 className={cn(
 "flex",
 msg.direction === "OUTBOUND" ? "justify-end" : "justify-start"
 )}
 >
 {msg.direction === "INBOUND" && (
 <Avatar className="h-6 w-6 mr-2 mt-1 flex-shrink-0">
 <AvatarFallback className={cn("text-[10px] font-semibold", avatarColor)}>
 {guestInitials}
 </AvatarFallback>
 </Avatar>
 )}
 <div
 className={cn(
 "max-w-[75%] rounded-2xl px-4 py-3",
 msg.direction === "OUTBOUND"
 ? "bg-primary text-primary-foreground rounded-br-md"
 : "bg-card rounded-bl-md"
 )}
 data-testid={`message-${msg.id}`}
 >
 <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
 <div
 className={cn(
 "mt-1 flex items-center justify-end gap-1 text-[11px]",
 msg.direction === "OUTBOUND"
 ? "text-primary-foreground/50"
 : "text-muted-foreground"
 )}
 >
 <span>
 {format(parseISO(msg.sentAt), "h:mm a")}
 </span>
 {msg.direction === "OUTBOUND" && (
 <CheckCheck className="h-2.5 w-2.5" />
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 <div ref={messagesEndRef} />
 </div>

 <div className="flex-shrink-0 border-t bg-background px-4 py-3 safe-area-bottom">
 {!canSendMessages ? (
 <div className="flex items-center gap-2 py-1" data-testid="text-messaging-disabled">
 <Send className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
 <p className="text-xs text-muted-foreground">
 {channelInfo.name} does not support sending messages from third-party apps. You can view messages here, but replies must be sent through {channelInfo.name} directly.
 </p>
 </div>
 ) : (
 <div className="flex items-end gap-2">
 <Sheet open={templateOpen} onOpenChange={setTemplateOpen}>
 <SheetTrigger asChild>
 <Button
 size="icon"
 variant="ghost"
 data-testid="button-templates"
 >
 <FileText className="h-4 w-4" />
 </Button>
 </SheetTrigger>
 <SheetContent side="bottom" className="max-h-[50vh]">
 <SheetHeader>
 <SheetTitle>Templates</SheetTitle>
 </SheetHeader>
 <p className="text-xs text-muted-foreground mt-1 mb-3">
 Variables like {"{guest_name}"}, {"{check_in}"}, {"{check_out}"}, {"{listing_name}"} will be replaced automatically.
 </p>
 <div className="space-y-2 overflow-y-auto">
 {templates.map((tmpl) => (
 <Card
 key={tmpl.id}
 className="cursor-pointer p-3.5 hover-elevate active-elevate-2"
 onClick={() => handleInsertTemplate(tmpl.body)}
 data-testid={`template-${tmpl.id}`}
 >
 <p className="text-sm font-medium">{tmpl.name}</p>
 <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
 {tmpl.body}
 </p>
 </Card>
 ))}
 {templates.length === 0 && (
 <p className="py-6 text-center text-xs text-muted-foreground">
 No templates yet. Create one in Settings.
 </p>
 )}
 </div>
 </SheetContent>
 </Sheet>
 <Textarea
 placeholder="Type a message..."
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 className="min-h-[40px] max-h-[100px] resize-none flex-1 text-sm"
 onKeyDown={(e) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 }}
 data-testid="input-message"
 />
 <Button
 size="icon"
 onClick={handleSend}
 disabled={!message.trim() || sendMutation.isPending}
 data-testid="button-send"
 >
 {sendMutation.isPending ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : (
 <Send className="h-4 w-4" />
 )}
 </Button>
 </div>
 )}
 </div>
 </div>
 );
}
