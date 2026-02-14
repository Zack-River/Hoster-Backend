import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import {
 ArrowLeft,
 Bell,
 BellOff,
 AlertTriangle,
 CheckCircle2,
 Clock,
 Sparkles,
 RefreshCw,
 LogIn,
 LogOut,
 Loader2,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationItem {
 id: string;
 type: string;
 title: string;
 body: string;
 entityType: string | null;
 entityId: string | null;
 createdAt: string;
 readAt: string | null;
}

interface NotificationsData {
 notifications: NotificationItem[];
 unreadCount: number;
}

const NOTIFICATION_ICONS: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
 DOUBLE_BOOKING_RISK: {
 icon: AlertTriangle,
 color: "text-amber-600",
 bg: "bg-amber-500/15",
 },
 SYNC_ERROR: {
 icon: RefreshCw,
 color: "text-red-600",
 bg: "bg-red-500/15",
 },
 CHECKIN_REMINDER: {
 icon: LogIn,
 color: "text-emerald-600",
 bg: "bg-emerald-500/15",
 },
 CLEANING_REMINDER: {
 icon: Sparkles,
 color: "text-violet-600",
 bg: "bg-violet-500/15",
 },
 CHECKOUT_REMINDER: {
 icon: LogOut,
 color: "text-teal-600",
 bg: "bg-teal-500/15",
 },
 NEW_RESERVATION: {
 icon: CheckCircle2,
 color: "text-emerald-600",
 bg: "bg-emerald-500/15",
 },
};

function getNotifMeta(type: string) {
 return NOTIFICATION_ICONS[type] || {
 icon: Bell,
 color: "text-muted-foreground",
 bg: "bg-muted",
 };
}

export default function NotificationsPage() {
 const [, setLocation] = useLocation();

 const { data, isLoading } = useQuery<NotificationsData>({
 queryKey: ["/api/notifications"],
 });

 const markReadMutation = useMutation({
 mutationFn: async (id: string) => {
 await apiRequest("PATCH", `/api/notifications/${id}/read`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 },
 });

 const markAllReadMutation = useMutation({
 mutationFn: async () => {
 await apiRequest("POST", "/api/notifications/read-all");
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 },
 });

 if (isLoading) {
 return (
 <div className="px-4 py-3 space-y-3">
 <Skeleton className="h-8 w-40" />
 <Skeleton className="h-20 w-full" />
 <Skeleton className="h-20 w-full" />
 <Skeleton className="h-20 w-full" />
 </div>
 );
 }

 const notifications = data?.notifications || [];
 const unreadCount = data?.unreadCount || 0;

 return (
 <div className="px-4 py-3 pb-6">
 <div className="flex items-center justify-between gap-2 mb-4">
 <div className="flex items-center gap-2.5">
 <Button
 size="icon"
 variant="ghost"
 onClick={() => setLocation("/")}
 data-testid="button-back-notifications"
 >
 <ArrowLeft className="h-4 w-4" />
 </Button>
 <h1 className="text-lg font-semibold" data-testid="text-notifications-title">
 Notifications
 </h1>
 {unreadCount > 0 && (
 <span
 className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground"
 data-testid="badge-unread-notifications"
 >
 {unreadCount}
 </span>
 )}
 </div>
 {unreadCount > 0 && (
 <Button
 size="sm"
 variant="ghost"
 onClick={() => markAllReadMutation.mutate()}
 disabled={markAllReadMutation.isPending}
 data-testid="button-mark-all-read"
 >
 {markAllReadMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 "Mark all read"
 )}
 </Button>
 )}
 </div>

 {notifications.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 text-center">
 <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
 <BellOff className="h-6 w-6 text-muted-foreground" />
 </div>
 <h2 className="text-sm font-semibold mb-1.5" data-testid="text-no-notifications">
 All caught up
 </h2>
 <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
 You have no notifications. We'll let you know about important updates here.
 </p>
 </div>
 ) : (
 <div className="space-y-2">
 {notifications.map((notif) => {
 const meta = getNotifMeta(notif.type);
 const Icon = meta.icon;
 const isUnread = !notif.readAt;

 return (
 <Card
 key={notif.id}
 className={cn(
 "p-3.5 cursor-pointer hover-elevate active-elevate-2 transition-colors",
 isUnread && "border-primary/20"
 )}
 onClick={() => {
 if (isUnread) {
 markReadMutation.mutate(notif.id);
 }
 }}
 data-testid={`notification-${notif.id}`}
 >
 <div className="flex gap-3">
 <div
 className={cn(
 "flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0",
 meta.bg
 )}
 >
 <Icon className={cn("h-4 w-4", meta.color)} />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-2">
 <p
 className={cn(
 "text-sm truncate",
 isUnread ? "font-semibold" : "font-medium"
 )}
 >
 {notif.title}
 </p>
 {isUnread && (
 <span className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-primary" />
 )}
 </div>
 <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
 {notif.body}
 </p>
 <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
 <Clock className="h-2.5 w-2.5" />
 {notif.createdAt
 ? formatDistanceToNow(parseISO(notif.createdAt), { addSuffix: true })
 : "Just now"}
 </p>
 </div>
 </div>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 );
}
