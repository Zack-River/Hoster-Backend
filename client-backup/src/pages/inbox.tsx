import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelIcon } from "@/components/channel-icon";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { MessageSquare, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CHANNEL_KEYS, CHANNEL_INFO, type ChannelKey } from "@/lib/constants";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const AVATAR_COLORS = [
 "bg-rose-500/15 text-rose-700",
 "bg-teal-500/15 text-teal-700",
 "bg-emerald-500/15 text-emerald-700",
 "bg-violet-500/15 text-violet-700",
 "bg-amber-500/15 text-amber-700",
 "bg-orange-500/15 text-orange-700",
 "bg-pink-500/15 text-pink-700",
 "bg-fuchsia-500/15 text-fuchsia-700",
 "bg-lime-500/15 text-lime-700",
 "bg-stone-500/15 text-stone-700",
];

function getAvatarColor(name: string): string {
 let hash = 0;
 for (let i = 0; i < name.length; i++) {
 hash = name.charCodeAt(i) + ((hash << 5) - hash);
 }
 return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ConversationItem {
 id: string;
 guestName: string;
 channelKey: ChannelKey;
 channelName: string;
 checkIn: string | null;
 checkOut: string | null;
 lastMessage: string | null;
 lastMessageAt: string | null;
 unreadCount: number;
 listingName: string;
}

export default function InboxPage() {
 const [filter, setFilter] = useState<ChannelKey | "ALL">("ALL");
 const [search, setSearch] = useState("");
 const [, setLocation] = useLocation();

 const { data, isLoading } = useQuery<ConversationItem[]>({
 queryKey: ["/api/inbox"],
 });

 const filtered = data
 ?.filter((c) => filter === "ALL" || c.channelKey === filter)
 .filter(
 (c) =>
 !search ||
 c.guestName.toLowerCase().includes(search.toLowerCase()) ||
 c.listingName.toLowerCase().includes(search.toLowerCase())
 )
 .sort((a, b) => {
 if (!a.lastMessageAt) return 1;
 if (!b.lastMessageAt) return -1;
 return (
 new Date(b.lastMessageAt).getTime() -
 new Date(a.lastMessageAt).getTime()
 );
 });

 return (
 <div>
 <div className="px-5 pt-4 pb-1">
 <h1 className="text-lg font-semibold mb-4" data-testid="text-inbox-title">Messages</h1>
 <div className="relative mb-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 placeholder="Search conversations..."
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="pl-9"
 data-testid="input-search-inbox"
 />
 </div>
 <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
 <Button
 size="sm"
 variant={filter === "ALL" ? "default" : "secondary"}
 onClick={() => setFilter("ALL")}
 data-testid="filter-all"
 >
 All
 </Button>
 {CHANNEL_KEYS.map((key) => (
 <Button
 key={key}
 size="sm"
 variant={filter === key ? "default" : "secondary"}
 onClick={() => setFilter(key)}
 data-testid={`filter-${key.toLowerCase()}`}
 >
 {CHANNEL_INFO[key].name}
 </Button>
 ))}
 </div>
 </div>
 <div className="px-4 pb-4">
 {isLoading ? (
 <div className="space-y-2 pt-2">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-18 w-full rounded-md" />
 ))}
 </div>
 ) : !filtered?.length ? (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
 <MessageSquare className="h-6 w-6 text-muted-foreground" />
 </div>
 <p className="text-sm font-medium">No conversations</p>
 <p className="text-xs text-muted-foreground mt-1.5 max-w-[200px]">
 {filter !== "ALL"
 ? `No ${CHANNEL_INFO[filter].name} conversations yet.`
 : "Messages will appear here after syncing channels."}
 </p>
 </div>
 ) : (
 <div className="space-y-0.5 pt-1">
 {filtered.map((conv) => (
 <div
 key={conv.id}
 className="flex items-center gap-3 rounded-md px-2 py-3 cursor-pointer hover-elevate active-elevate-2"
 onClick={() => setLocation(`/chat/${conv.id}`)}
 data-testid={`conversation-${conv.id}`}
 >
 <div className="relative flex-shrink-0">
 <Avatar className="h-10 w-10" data-testid={`avatar-guest-${conv.id}`}>
 <AvatarFallback className={cn("text-xs font-semibold", getAvatarColor(conv.guestName))}>
 {conv.guestName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
 </AvatarFallback>
 </Avatar>
 <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border" data-testid={`channel-badge-${conv.id}`}>
 <ChannelIcon channelKey={conv.channelKey} size={11} />
 </div>
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center justify-between gap-2">
 <span
 className="text-sm font-semibold truncate"
 >
 {conv.guestName}
 </span>
 {conv.lastMessageAt && (
 <span className="flex-shrink-0 text-xs text-muted-foreground">
 {formatDistanceToNow(
 parseISO(conv.lastMessageAt),
 { addSuffix: false }
 )}
 </span>
 )}
 </div>
 <div className="flex items-center justify-between gap-2 mt-0.5">
 <p
 className="truncate text-xs text-muted-foreground leading-relaxed"
 >
 {conv.lastMessage || "No messages yet"}
 </p>
 <div className="flex items-center gap-1.5 flex-shrink-0">
 {!CHANNEL_INFO[conv.channelKey]?.permissions?.messagesWrite && (
 <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`badge-readonly-${conv.id}`}>
 <Eye className="h-3.5 w-3.5" />
 View only
 </span>
 )}
 {conv.unreadCount > 0 && (
 <Badge
 variant="destructive"
 className="flex-shrink-0"
 >
 {conv.unreadCount}
 </Badge>
 )}
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
