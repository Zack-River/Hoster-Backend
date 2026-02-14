import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { ChannelLogoCircle, ChannelBadge } from "@/components/channel-icon";
import { Link, useLocation } from "wouter";
import {
 LogIn,
 RefreshCw,
 User,
 Home,
 DollarSign,
 TrendingUp,
 Building2,
 Bell,
 AlertTriangle,
 XCircle,
 ChevronRight,
 Star,
 Phone,
 Mail,
 MapPin,
 CalendarDays,
 Sparkles,
 CheckCircle2,
 Clock,
 Loader2,
 Check,
 X,
 BellRing,
 Calendar,
 Zap,
} from "lucide-react";
import { format, parseISO, addDays, isWithinInterval } from "date-fns";
import type { ChannelKey } from "@/lib/constants";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import eventFoodFestival from "@assets/event-food-festival.png";
import eventMusicConcert from "@assets/event-music-concert.png";
import eventArtExhibition from "@assets/event-art-exhibition.png";
import eventWellnessRetreat from "@assets/event-wellness-retreat.png";
import eventFarmersMarket from "@assets/event-farmers-market.png";

function getGuestRating(guestName: string): number {
 let hash = 0;
 for (let i = 0; i < guestName.length; i++) {
 hash = ((hash << 5) - hash + guestName.charCodeAt(i)) | 0;
 }
 return 3.5 + (Math.abs(hash) % 15) / 10;
}

function getGuestStays(guestName: string): number {
 let hash = 0;
 for (let i = 0; i < guestName.length; i++) {
 hash = ((hash << 3) + guestName.charCodeAt(i)) | 0;
 }
 return 1 + (Math.abs(hash) % 12);
}

function getGuestPhone(guestName: string): string {
 let hash = 0;
 for (let i = 0; i < guestName.length; i++) {
 hash = ((hash << 4) + guestName.charCodeAt(i)) | 0;
 }
 const num = Math.abs(hash) % 9000000 + 1000000;
 return `+1 (555) ${String(num).slice(0, 3)}-${String(num).slice(3, 7)}`;
}

function getGuestEmail(guestName: string): string {
 const parts = guestName.toLowerCase().split(" ");
 return `${parts[0]}.${parts[parts.length - 1]}@email.com`;
}

function getGuestCountry(guestName: string): string {
 const countries = ["United States", "United Kingdom", "Germany", "France", "Japan", "Canada", "Australia", "Saudi Arabia", "UAE", "Spain"];
 let hash = 0;
 for (let i = 0; i < guestName.length; i++) {
 hash = ((hash << 2) + guestName.charCodeAt(i)) | 0;
 }
 return countries[Math.abs(hash) % countries.length];
}

function getGuestColor(guestName: string): string {
 const colors = [
 "bg-rose-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
 "bg-teal-500", "bg-orange-500", "bg-fuchsia-500", "bg-pink-500",
 ];
 let hash = 0;
 for (let i = 0; i < guestName.length; i++) {
 hash = ((hash << 5) - hash + guestName.charCodeAt(i)) | 0;
 }
 return colors[Math.abs(hash) % colors.length];
}

const UPCOMING_EVENTS = [
  {
    id: "evt-1",
    title: "Street Food Festival",
    location: "Downtown Square",
    image: eventFoodFestival,
    daysFromNow: 5,
    category: "Food & Drink",
  },
  {
    id: "evt-2",
    title: "Live Music Night",
    location: "Waterfront Park",
    image: eventMusicConcert,
    daysFromNow: 8,
    category: "Music",
  },
  {
    id: "evt-3",
    title: "Modern Art Exhibition",
    location: "City Gallery",
    image: eventArtExhibition,
    daysFromNow: 12,
    category: "Art & Culture",
  },
  {
    id: "evt-4",
    title: "Sunrise Yoga Retreat",
    location: "Oceanview Beach",
    image: eventWellnessRetreat,
    daysFromNow: 18,
    category: "Wellness",
  },
  {
    id: "evt-5",
    title: "Organic Farmers Market",
    location: "Central Park",
    image: eventFarmersMarket,
    daysFromNow: 22,
    category: "Market",
  },
];

function getUpcomingEvents() {
  const today = new Date();
  const thirtyDaysFromNow = addDays(today, 30);
  return UPCOMING_EVENTS.filter((evt) => {
    const eventDate = addDays(today, evt.daysFromNow);
    return isWithinInterval(eventDate, { start: today, end: thirtyDaysFromNow });
  }).map((evt) => ({
    ...evt,
    date: addDays(today, evt.daysFromNow),
  }));
}

interface ReservationItem {
 id: string;
 guestName: string;
 checkIn: string;
 checkOut: string;
 listingName: string;
 channelKey: ChannelKey;
 totalAmount: string | null;
 currency: string;
}

interface CleaningTaskItem {
 id: string;
 listingName: string;
 guestName: string;
 cleaningCompany: string;
 cleaningCompanyPhone: string | null;
 status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
 scheduledAt: string | null;
}

interface DashboardData {
 nextCheckIn: {
 guestName: string;
 channelKey: ChannelKey;
 date: string;
 listingName: string;
 } | null;
 unreadMessages: number;
 channelStatuses: Array<{
 channelKey: ChannelKey;
 name: string;
 status: string;
 lastSyncAt: string | null;
 lastError: string | null;
 }>;
 notifications: Array<{
 id: string;
 type: string;
 title: string;
 body: string;
 createdAt: string;
 }>;
 totalListings: number;
 availableCount: number;
 occupiedCount: number;
 occupancyRate: number;
 monthRevenue: number;
 upcomingReservations: ReservationItem[];
 pendingReservations: ReservationItem[];
 hasMappingIssue: boolean;
 hasSyncError: boolean;
 pendingCleaningTasks: CleaningTaskItem[];
}

export default function HomePage() {
 const { user } = useAuth();

 const [, setLocation] = useLocation();
 const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
 const [guestProfileReservation, setGuestProfileReservation] = useState<ReservationItem | null>(null);
 const { toast } = useToast();

 const { data, isLoading } = useQuery<DashboardData>({
 queryKey: ["/api/dashboard"],
 });

 const updateTaskMutation = useMutation({
 mutationFn: async ({ id, status }: { id: string; status: string }) => {
 const res = await apiRequest("PATCH", `/api/cleaning-tasks/${id}/status`, { status });
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 toast({ title: "Task updated" });
 },
 });

 const acceptMutation = useMutation({
 mutationFn: async (id: string) => {
 const res = await apiRequest("POST", `/api/reservations/${id}/accept`);
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 setGuestProfileReservation(null);
 toast({ title: "Reservation accepted" });
 },
 onError: () => {
 toast({ title: "Failed to accept reservation", variant: "destructive" });
 },
 });

 const rejectMutation = useMutation({
 mutationFn: async (id: string) => {
 const res = await apiRequest("POST", `/api/reservations/${id}/reject`);
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 setGuestProfileReservation(null);
 toast({ title: "Reservation rejected" });
 },
 onError: () => {
 toast({ title: "Failed to reject reservation", variant: "destructive" });
 },
 });

 const hasChannels = data?.channelStatuses && data.channelStatuses.length > 0;
 const pendingReservations = data?.pendingReservations ?? [];
 const newestPending = pendingReservations.length > 0 ? pendingReservations[0] : null;
 const isMutating = acceptMutation.isPending || rejectMutation.isPending;

 return (
  <div className="pb-2">
   <div className="px-5 pt-5 pb-4">
   <div className="flex items-center justify-between gap-3">
   <div
   className="flex items-center gap-3 min-w-0 cursor-pointer"
   onClick={() => setLocation("/profile")}
   data-testid="link-profile"
   >
   <Avatar className="h-12 w-12 flex-shrink-0">
   <AvatarImage
   src={user?.profileImageUrl || undefined}
   alt={user?.firstName || "User"}
   />
   <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
   {user?.firstName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
   </AvatarFallback>
   </Avatar>
   <div className="min-w-0">
   <p className="text-xs text-muted-foreground font-medium">Welcome back</p>
   <p className="text-base font-bold truncate" data-testid="text-user-name">
   {user?.firstName || "Host"}
   </p>
   </div>
   </div>
   <div className="flex items-center gap-1 flex-shrink-0">
   <Button
   size="icon"
   variant="ghost"
   onClick={() => setLocation("/notifications")}
   data-testid="button-notifications"
   >
   <div className="relative">
   <Bell className="h-4.5 w-4.5" />
   {data?.notifications && data.notifications.length > 0 && (
   <span
   className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-white"
   data-testid="badge-notifications-count"
   >
   {data.notifications.length > 9 ? "9+" : data.notifications.length}
   </span>
   )}
   </div>
   </Button>
   </div>
   </div>
   </div>
   <div className="px-4 space-y-3">
   {!hasChannels && !isLoading && (
   <Card className="p-5">
   <div className="flex flex-col items-center gap-3 py-3 text-center">
   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
   <RefreshCw className="h-5 w-5 text-muted-foreground" />
   </div>
   <div>
   <h3 className="font-semibold text-sm mb-1">Connect your first channel</h3>
   <p className="text-xs text-muted-foreground leading-relaxed">
   Link Airbnb, Booking.com, Expedia, or TripAdvisor to start managing your rentals.
   </p>
   </div>
   <Link href="/settings">
   <Button data-testid="button-connect-channels">
   Connect channels
   </Button>
   </Link>
   </div>
   </Card>
   )}

   {!isLoading && data?.hasSyncError && (
   <div
   className="flex items-center gap-3 p-3.5 rounded-md bg-destructive/10 cursor-pointer hover-elevate active-elevate-2"
   onClick={() => setLocation("/settings")}
   data-testid="alert-sync-error"
   >
   <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
   <div className="min-w-0 flex-1">
   <p className="text-xs font-medium text-destructive">Channel sync error</p>
   <p className="text-xs text-destructive/80 mt-0.5">One or more channels failed to sync. Tap to view details.</p>
   </div>
   <ChevronRight className="h-4 w-4 text-destructive/60 flex-shrink-0" />
   </div>
   )}

   {!isLoading && data?.hasMappingIssue && (
   <div
   className="flex items-center gap-3 p-3.5 rounded-md bg-amber-500/10 cursor-pointer hover-elevate active-elevate-2"
   onClick={() => setLocation("/settings")}
   data-testid="alert-mapping-issue"
   >
   <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
   <div className="min-w-0 flex-1">
   <p className="text-xs font-medium text-amber-700">Listings need mapping</p>
   <p className="text-xs text-amber-600/80 mt-0.5">Some listings are not mapped to all channels.</p>
   </div>
   <ChevronRight className="h-4 w-4 text-amber-600/60 flex-shrink-0" />
   </div>
   )}

   {isLoading ? (
   <div className="space-y-3">
   <div className="grid grid-cols-3 gap-3">
   <Skeleton className="h-24 w-full rounded-md" />
   <Skeleton className="h-24 w-full rounded-md" />
   <Skeleton className="h-24 w-full rounded-md" />
   </div>
   <Skeleton className="h-20 w-full rounded-md" />
   <Skeleton className="h-16 w-full rounded-md" />
   <Skeleton className="h-40 w-full rounded-md" />
   </div>
   ) : (
   <>
   <div className="grid grid-cols-3 gap-3">
   <Card className="p-4 text-center" data-testid="card-available-units">
   <div className="flex justify-center mb-2">
   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/12">
   <Home className="h-4 w-4 text-teal-600" />
   </div>
   </div>
   <p className="text-xl font-extrabold" data-testid="text-available-count">{data?.availableCount ?? 0}<span className="text-sm font-semibold text-muted-foreground">/{data?.totalListings ?? 0}</span></p>
   <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">Booked</p>
   </Card>

   <Card className="p-4 text-center" data-testid="card-occupancy-rate">
   <div className="flex justify-center mb-2">
   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/12">
   <TrendingUp className="h-4 w-4 text-rose-600" />
   </div>
   </div>
   <p className="text-xl font-extrabold" data-testid="text-occupancy-rate">{data?.occupancyRate ?? 0}%</p>
   <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">Occupied</p>
   </Card>

   <Card className="p-4 text-center" data-testid="card-month-revenue">
   <div className="flex justify-center mb-2">
   <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/12">
   <DollarSign className="h-4 w-4 text-amber-600" />
   </div>
   </div>
   <p className="text-xl font-extrabold" data-testid="text-month-revenue">
   ${data?.monthRevenue ? data.monthRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "0"}
   </p>
   <p className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wide font-semibold">This month</p>
   </Card>
   </div>

   {newestPending && (
   <Card className="p-4 border-primary/30" data-testid="card-new-reservation">
   <div className="flex items-center justify-between gap-2 mb-3">
   <div className="flex items-center gap-1.5">
   <BellRing className="h-3.5 w-3.5 text-primary" />
   <span className="text-xs font-semibold uppercase tracking-wider text-primary">
   New Reservation
   </span>
   </div>
   {pendingReservations.length > 1 && (
   <Badge variant="secondary" data-testid="badge-pending-count">
   +{pendingReservations.length - 1} more
   </Badge>
   )}
   </div>
   <div className="flex items-center gap-3">
   <div
   className="relative flex-shrink-0 cursor-pointer"
   onClick={() => setGuestProfileReservation(newestPending)}
   data-testid="button-guest-profile"
   >
   <Avatar className="h-11 w-11">
   <AvatarFallback className={`${getGuestColor(newestPending.guestName)} text-white text-sm font-semibold`}>
   {newestPending.guestName.split(" ").map(n => n[0]).join("")}
   </AvatarFallback>
   </Avatar>
   <span className="absolute -bottom-0.5 -right-0.5">
   <ChannelLogoCircle channelKey={newestPending.channelKey} size={18} />
   </span>
   </div>
   <div className="min-w-0 flex-1">
   <p
   className="text-sm font-semibold truncate cursor-pointer"
   onClick={() => setGuestProfileReservation(newestPending)}
   data-testid="text-pending-guest-name"
   >
   {newestPending.guestName}
   </p>
   <p className="text-xs text-muted-foreground mt-0.5">
   {format(parseISO(newestPending.checkIn), "MMM d")} - {format(parseISO(newestPending.checkOut), "MMM d")}
   </p>
   <p className="text-xs text-muted-foreground truncate">
   {newestPending.listingName}
   </p>
   </div>
   {newestPending.totalAmount && (
   <span className="text-sm font-bold flex-shrink-0" data-testid="text-pending-amount">
   ${parseFloat(newestPending.totalAmount as any).toLocaleString(undefined, { maximumFractionDigits: 0 })}
   </span>
   )}
   </div>
   <div className="flex items-center gap-2 mt-3">
   <Button
   className="flex-1"
   onClick={() => acceptMutation.mutate(newestPending.id)}
   disabled={isMutating}
   data-testid="button-accept-reservation"
   >
   {acceptMutation.isPending ? (
   <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
   ) : (
   <Check className="h-4 w-4 mr-1.5" />
   )}
   Accept
   </Button>
   <Button
   variant="outline"
   className="flex-1"
   onClick={() => rejectMutation.mutate(newestPending.id)}
   disabled={isMutating}
   data-testid="button-reject-reservation"
   >
   {rejectMutation.isPending ? (
   <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
   ) : (
   <X className="h-4 w-4 mr-1.5" />
   )}
   Reject
   </Button>
   </div>
   </Card>
   )}

   <Card className="p-3" data-testid="card-next-checkin">
   <div className="flex items-center gap-3">
   <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/12 flex-shrink-0">
   <LogIn className="h-3.5 w-3.5 text-teal-600" />
   </div>
   {data?.nextCheckIn ? (
   <div className="min-w-0 flex-1">
   <div className="flex items-center gap-2">
   <p className="font-semibold truncate text-[15px]">{data.nextCheckIn.guestName}</p>
   <ChannelLogoCircle channelKey={data.nextCheckIn.channelKey as ChannelKey} size={16} />
   </div>
   <p className="text-muted-foreground mt-0.5 text-[14px]">
   {format(parseISO(data.nextCheckIn.date), "MMM d, yyyy")}
   <span className="mx-1.5 opacity-30">|</span>
   {data.nextCheckIn.listingName}
   </p>
   </div>
   ) : (
   <div className="min-w-0 flex-1">
   <p className="text-sm font-medium text-muted-foreground">No upcoming check-ins</p>
   </div>
   )}
   <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 flex-shrink-0">
   Check-in
   </span>
   </div>
   </Card>

   <Card className="p-4" data-testid="card-upcoming-reservations">
   <div className="flex items-center justify-between gap-2 mb-3">
   <div className="flex items-center gap-1.5 text-muted-foreground">
   <Building2 className="h-3.5 w-3.5" />
   <span className="text-xs font-semibold uppercase tracking-wider">
   Upcoming reservations
   </span>
   </div>
   {data?.upcomingReservations && data.upcomingReservations.length > 0 && (
   <Badge variant="secondary">{data.upcomingReservations.length}</Badge>
   )}
   </div>
   {data?.upcomingReservations && data.upcomingReservations.length > 0 ? (
   <div className="space-y-3">
   {data.upcomingReservations.map((res) => (
   <div
   key={res.id}
   className="flex items-center gap-3 cursor-pointer rounded-md p-2 -mx-2 hover-elevate active-elevate-2"
   onClick={() => setSelectedReservation(res)}
   data-testid={`reservation-${res.id}`}
   >
   <div className="relative flex-shrink-0" data-testid={`avatar-reservation-${res.id}`}>
   <Avatar className="h-10 w-10">
   <AvatarFallback className="bg-muted text-xs font-semibold">
   {res.guestName.split(" ").map(n => n[0]).join("")}
   </AvatarFallback>
   </Avatar>
   <span className="absolute -bottom-0.5 -right-0.5" data-testid={`channel-logo-${res.channelKey.toLowerCase()}-${res.id}`}>
   <ChannelLogoCircle channelKey={res.channelKey} size={18} />
   </span>
   </div>
   <div className="min-w-0 flex-1">
   <p className="font-medium truncate text-[15px]">{res.guestName}</p>
   <p className="text-muted-foreground mt-0.5 text-[13px]">
   {format(parseISO(res.checkIn), "MMM d")} - {format(parseISO(res.checkOut), "MMM d")}
   <span className="mx-1.5 opacity-30">|</span>
   {res.listingName}
   </p>
   </div>
   {res.totalAmount && (
   <span className="text-sm font-semibold flex-shrink-0">
   ${parseFloat(res.totalAmount as any).toLocaleString(undefined, { maximumFractionDigits: 0 })}
   </span>
   )}
   </div>
   ))}
   </div>
   ) : (
   <div className="flex flex-col items-center gap-2 py-4 text-center" data-testid="empty-upcoming-reservations">
   <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
   <CalendarDays className="h-4 w-4 text-muted-foreground" />
   </div>
   <p className="text-sm text-muted-foreground">No upcoming reservations</p>
   </div>
   )}
   </Card>

   {data?.pendingCleaningTasks && data.pendingCleaningTasks.length > 0 && (
   <Card className="p-4" data-testid="card-cleaning-tasks">
   <div className="flex items-center justify-between gap-2 mb-3">
   <div className="flex items-center gap-1.5 text-muted-foreground">
   <Sparkles className="h-3.5 w-3.5" />
   <span className="text-xs font-semibold uppercase tracking-wider">
   Cleaning Tasks
   </span>
   </div>
   <Badge variant="secondary">{data.pendingCleaningTasks.length}</Badge>
   </div>
   <div className="space-y-2.5">
   {data.pendingCleaningTasks.map((task) => (
   <div
   key={task.id}
   className="flex items-start gap-3 p-2.5 rounded-md border"
   data-testid={`cleaning-task-${task.id}`}
   >
   <div className="flex-shrink-0 mt-0.5">
   {task.status === "PENDING" ? (
   <Clock className="h-4 w-4 text-amber-500" />
   ) : (
   <Loader2 className="h-4 w-4 text-primary animate-spin" />
   )}
   </div>
   <div className="min-w-0 flex-1">
   <p className="text-sm font-medium truncate" data-testid={`text-task-listing-${task.id}`}>{task.listingName}</p>
   <p className="text-xs text-muted-foreground mt-0.5">
   After {task.guestName}'s checkout
   </p>
   <p className="text-xs text-muted-foreground mt-0.5">
   {task.cleaningCompany}
   {task.cleaningCompanyPhone && (
   <span className="ml-1.5 opacity-70">{task.cleaningCompanyPhone}</span>
   )}
   </p>
   </div>
   <div className="flex-shrink-0">
   {task.status === "PENDING" ? (
   <Button
   size="sm"
   variant="outline"
   onClick={() => updateTaskMutation.mutate({ id: task.id, status: "IN_PROGRESS" })}
   data-testid={`button-start-task-${task.id}`}
   >
   Start
   </Button>
   ) : (
   <Button
   size="sm"
   onClick={() => updateTaskMutation.mutate({ id: task.id, status: "COMPLETED" })}
   data-testid={`button-complete-task-${task.id}`}
   >
   <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
   Done
   </Button>
   )}
   </div>
   </div>
   ))}
   </div>
   </Card>
   )}

   {(() => {
     const upcomingEvents = getUpcomingEvents();
     if (upcomingEvents.length === 0) return null;
     return (
       <Card className="p-4" data-testid="card-upcoming-events">
         <div className="flex items-center gap-1.5 mb-3">
           <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
           <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
             Upcoming events in your city
           </span>
         </div>
         <div className="space-y-2.5">
           {upcomingEvents.map((evt) => (
             <div
               key={evt.id}
               className="flex items-center gap-3 p-2 -mx-2 rounded-md hover-elevate active-elevate-2 cursor-pointer"
               data-testid={`event-${evt.id}`}
             >
               <img
                 src={evt.image}
                 alt={evt.title}
                 className="h-14 w-14 rounded-md object-cover flex-shrink-0"
                 data-testid={`img-event-${evt.id}`}
               />
               <div className="min-w-0 flex-1">
                 <p className="text-sm font-medium truncate" data-testid={`text-event-title-${evt.id}`}>{evt.title}</p>
                 <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-event-date-${evt.id}`}>
                   {format(evt.date, "MMM d, yyyy")}
                   <span className="mx-1.5 opacity-30">|</span>
                   {evt.location}
                 </p>
                 <Badge variant="secondary" className="mt-1 text-[10px]" data-testid={`badge-event-category-${evt.id}`}>{evt.category}</Badge>
               </div>
               <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
             </div>
           ))}
         </div>
       </Card>
     );
   })()}
   </>
   )}
   </div>
   <Dialog open={!!selectedReservation} onOpenChange={(open) => { if (!open) setSelectedReservation(null); }}>
   <DialogContent className="max-w-sm rounded-lg" data-testid="dialog-guest-info">
   {selectedReservation && (() => {
   const res = selectedReservation;
   const rating = getGuestRating(res.guestName);
   const stays = getGuestStays(res.guestName);
   const phone = getGuestPhone(res.guestName);
   const email = getGuestEmail(res.guestName);
   const country = getGuestCountry(res.guestName);
   const initials = res.guestName.split(" ").map(n => n[0]).join("");
   const colorClass = getGuestColor(res.guestName);
   const nights = Math.ceil(
   (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)
   );

   return (
   <>
   <DialogHeader>
   <DialogTitle className="text-base">Guest Details</DialogTitle>
   <DialogDescription className="sr-only">
   Information about the guest and their reservation
   </DialogDescription>
   </DialogHeader>
   <div className="space-y-4">
   <div className="flex items-center gap-3">
   <Avatar className="h-14 w-14 flex-shrink-0">
   <AvatarFallback className={`${colorClass} text-white text-base font-semibold`}>
   {initials}
   </AvatarFallback>
   </Avatar>
   <div className="min-w-0 flex-1">
   <p className="text-base font-semibold" data-testid="text-guest-name">{res.guestName}</p>
   <div className="flex items-center gap-2 mt-1">
   <ChannelBadge channelKey={res.channelKey} />
   </div>
   </div>
   </div>

   <div className="flex items-center gap-4">
   <div className="flex items-center gap-1">
   <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
   <span className="text-sm font-semibold" data-testid="text-guest-rating">{rating.toFixed(1)}</span>
   </div>
   <div className="text-sm text-muted-foreground" data-testid="text-guest-stays">
   {stays} previous {stays === 1 ? "stay" : "stays"}
   </div>
   </div>

   <div className="space-y-2.5 p-3 rounded-md border">
   <div className="flex items-center gap-2.5">
   <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
   <span className="text-sm" data-testid="text-guest-phone">{phone}</span>
   </div>
   <div className="flex items-center gap-2.5">
   <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
   <span className="text-sm truncate" data-testid="text-guest-email">{email}</span>
   </div>
   <div className="flex items-center gap-2.5">
   <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
   <span className="text-sm" data-testid="text-guest-country">{country}</span>
   </div>
   </div>

   <div className="space-y-2.5 p-3 rounded-md border">
   <div className="flex items-center gap-2 mb-1">
   <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
   <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reservation</span>
   </div>
   <div className="grid grid-cols-3 gap-2 text-center">
   <div>
   <p className="text-xs text-muted-foreground">Check-in</p>
   <p className="text-sm font-semibold">{format(parseISO(res.checkIn), "MMM d")}</p>
   </div>
   <div>
   <p className="text-xs text-muted-foreground">Check-out</p>
   <p className="text-sm font-semibold">{format(parseISO(res.checkOut), "MMM d")}</p>
   </div>
   <div>
   <p className="text-xs text-muted-foreground">Nights</p>
   <p className="text-sm font-semibold">{nights}</p>
   </div>
   </div>
   <div className="flex items-center justify-between gap-2 pt-2 border-t">
   <span className="text-xs text-muted-foreground">{res.listingName}</span>
   {res.totalAmount && (
   <span className="text-sm font-bold" data-testid="text-guest-total">
   ${parseFloat(res.totalAmount as any).toLocaleString(undefined, { maximumFractionDigits: 0 })}
   </span>
   )}
   </div>
   </div>
   </div>
   </>
   );
   })()}
   </DialogContent>
   </Dialog>
   <Dialog open={!!guestProfileReservation} onOpenChange={(open) => { if (!open) setGuestProfileReservation(null); }}>
   <DialogContent className="max-w-sm rounded-lg" data-testid="dialog-guest-profile">
   {guestProfileReservation && (() => {
   const res = guestProfileReservation;
   const rating = getGuestRating(res.guestName);
   const stays = getGuestStays(res.guestName);
   const phone = getGuestPhone(res.guestName);
   const email = getGuestEmail(res.guestName);
   const country = getGuestCountry(res.guestName);
   const initials = res.guestName.split(" ").map(n => n[0]).join("");
   const colorClass = getGuestColor(res.guestName);
   const nights = Math.ceil(
   (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24)
   );

   return (
   <>
   <DialogHeader>
   <DialogTitle className="text-base">Guest Profile</DialogTitle>
   <DialogDescription className="sr-only">
   Review guest profile and accept or reject the reservation
   </DialogDescription>
   </DialogHeader>
   <div className="space-y-4">
   <div className="flex items-center gap-3">
   <Avatar className="h-14 w-14 flex-shrink-0">
   <AvatarFallback className={`${colorClass} text-white text-base font-semibold`}>
   {initials}
   </AvatarFallback>
   </Avatar>
   <div className="min-w-0 flex-1">
   <p className="text-base font-semibold" data-testid="text-profile-guest-name">{res.guestName}</p>
   <div className="flex items-center gap-2 mt-1">
   <ChannelBadge channelKey={res.channelKey} />
   </div>
   </div>
   </div>

   <div className="flex items-center gap-4">
   <div className="flex items-center gap-1">
   <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
   <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
   </div>
   <div className="text-sm text-muted-foreground">
   {stays} previous {stays === 1 ? "stay" : "stays"}
   </div>
   </div>

   <div className="space-y-2.5 p-3 rounded-md border">
   <div className="flex items-center gap-2 mb-1">
   <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
   <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reservation</span>
   </div>
   <div className="grid grid-cols-3 gap-2 text-center">
   <div>
   <p className="text-xs text-muted-foreground">Check-in</p>
   <p className="text-sm font-semibold">{format(parseISO(res.checkIn), "MMM d")}</p>
   </div>
   <div>
   <p className="text-xs text-muted-foreground">Check-out</p>
   <p className="text-sm font-semibold">{format(parseISO(res.checkOut), "MMM d")}</p>
   </div>
   <div>
   <p className="text-xs text-muted-foreground">Nights</p>
   <p className="text-sm font-semibold">{nights}</p>
   </div>
   </div>
   <div className="flex items-center justify-between gap-2 pt-2 border-t">
   <span className="text-xs text-muted-foreground">{res.listingName}</span>
   {res.totalAmount && (
   <span className="text-sm font-bold">
   ${parseFloat(res.totalAmount as any).toLocaleString(undefined, { maximumFractionDigits: 0 })}
   </span>
   )}
   </div>
   </div>

   <div className="space-y-2.5 p-3 rounded-md border">
   <div className="flex items-center gap-2.5">
   <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
   <span className="text-sm">{phone}</span>
   </div>
   <div className="flex items-center gap-2.5">
   <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
   <span className="text-sm truncate">{email}</span>
   </div>
   <div className="flex items-center gap-2.5">
   <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
   <span className="text-sm">{country}</span>
   </div>
   </div>

   <div className="flex items-center gap-2">
   <Button
   className="flex-1"
   onClick={() => acceptMutation.mutate(res.id)}
   disabled={isMutating}
   data-testid="button-profile-accept"
   >
   {acceptMutation.isPending ? (
   <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
   ) : (
   <Check className="h-4 w-4 mr-1.5" />
   )}
   Accept
   </Button>
   <Button
   variant="outline"
   className="flex-1"
   onClick={() => rejectMutation.mutate(res.id)}
   disabled={isMutating}
   data-testid="button-profile-reject"
   >
   {rejectMutation.isPending ? (
   <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
   ) : (
   <X className="h-4 w-4 mr-1.5" />
   )}
   Reject
   </Button>
   </div>
   </div>
   </>
   );
   })()}
   </DialogContent>
   </Dialog>
  </div>
 );
}
