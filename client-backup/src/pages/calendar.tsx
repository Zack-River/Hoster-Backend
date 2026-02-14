import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { ChannelBadge, ChannelIcon } from "@/components/channel-icon";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
 ChevronLeft,
 ChevronRight,
 Lock,
 CalendarDays,
 Info,
 Flame,
 Trophy,
 Star,
 Music,
 MapPin,
 Ticket,
} from "lucide-react";
import {
 format,
 startOfMonth,
 endOfMonth,
 eachDayOfInterval,
 getDay,
 addMonths,
 subMonths,
 isToday,
 parseISO,
 isBefore,
} from "date-fns";
import type { Listing, Reservation, CalendarDay } from "@shared/schema";
import type { ChannelKey } from "@/lib/constants";

interface SaudiEvent {
 name: string;
 location: string;
 startDate: string;
 endDate: string;
 category: "season" | "sport" | "religious" | "national" | "entertainment";
 description: string;
}

const SAUDI_EVENTS: SaudiEvent[] = [
 { name: "Ramadan", location: "Nationwide", startDate: "2026-02-18", endDate: "2026-03-19", category: "religious", description: "Holy month - high demand for short stays and Umrah visitors" },
 { name: "Eid Al-Fitr", location: "Nationwide", startDate: "2026-03-20", endDate: "2026-03-22", category: "religious", description: "End of Ramadan celebrations - peak domestic travel" },
 { name: "Hajj Season", location: "Makkah & Madinah", startDate: "2026-05-25", endDate: "2026-05-30", category: "religious", description: "Annual pilgrimage - extremely high demand in Makkah region" },
 { name: "Eid Al-Adha", location: "Nationwide", startDate: "2026-05-27", endDate: "2026-05-30", category: "religious", description: "Festival of sacrifice - peak holiday period nationwide" },
 { name: "Saudi National Day", location: "Nationwide", startDate: "2026-09-23", endDate: "2026-09-23", category: "national", description: "National celebrations - events across all major cities" },
 { name: "Riyadh Season 2025-26", location: "Riyadh", startDate: "2025-10-10", endDate: "2026-03-19", category: "season", description: "Entertainment mega-event with concerts, sports, and attractions" },
 { name: "Soundstorm Festival", location: "Riyadh", startDate: "2025-12-11", endDate: "2025-12-13", category: "entertainment", description: "Middle East's largest music festival" },
 { name: "WWE Royal Rumble", location: "Riyadh", startDate: "2026-01-31", endDate: "2026-01-31", category: "sport", description: "First Royal Rumble outside North America" },
 { name: "Saudi Cup Horse Racing", location: "Riyadh", startDate: "2026-02-13", endDate: "2026-02-14", category: "sport", description: "World's richest horse race - $38M+ prize pool" },
 { name: "Formula E Jeddah E-Prix", location: "Jeddah", startDate: "2026-02-14", endDate: "2026-02-15", category: "sport", description: "Night races on the Red Sea coast" },
 { name: "F1 Saudi Arabian Grand Prix", location: "Jeddah", startDate: "2026-03-06", endDate: "2026-03-08", category: "sport", description: "Formula 1 race at Jeddah Corniche Circuit" },
 { name: "Sharqiyah Season", location: "Eastern Province", startDate: "2026-03-01", endDate: "2026-03-31", category: "season", description: "Eastern Province entertainment and cultural events" },
 { name: "Jeddah Season", location: "Jeddah", startDate: "2026-06-01", endDate: "2026-08-31", category: "season", description: "Summer entertainment with beach events and festivals" },
 { name: "Esports World Cup", location: "Riyadh", startDate: "2026-07-06", endDate: "2026-08-23", category: "entertainment", description: "Global esports tournament - attracts international visitors" },
 { name: "AlUla Season", location: "AlUla", startDate: "2025-10-01", endDate: "2026-03-31", category: "season", description: "Heritage and cultural tourism in the ancient city" },
];

function getUpcomingEvents(count: number = 8): SaudiEvent[] {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 return SAUDI_EVENTS
   .filter(e => new Date(e.endDate) >= today)
   .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
   .slice(0, count);
}

function getEventCategoryIcon(category: SaudiEvent["category"]) {
 switch (category) {
   case "season": return Flame;
   case "sport": return Trophy;
   case "religious": return Star;
   case "national": return MapPin;
   case "entertainment": return Music;
 }
}

function getEventCategoryColor(category: SaudiEvent["category"]) {
 switch (category) {
   case "season": return "text-orange-600 bg-orange-500/12";
   case "sport": return "text-blue-600 bg-blue-500/12";
   case "religious": return "text-emerald-600 bg-emerald-500/12";
   case "national": return "text-green-700 bg-green-500/12";
   case "entertainment": return "text-purple-600 bg-purple-500/12";
 }
}

function isEventActive(event: SaudiEvent): boolean {
 const today = new Date();
 today.setHours(0, 0, 0, 0);
 return new Date(event.startDate) <= today && new Date(event.endDate) >= today;
}

interface CalendarData {
 listings: Array<
 Listing & {
 channels: Array<{ channelKey: ChannelKey; channelName: string }>;
 }
 >;
 reservations: Reservation[];
 calendarDays: CalendarDay[];
}

export default function CalendarPage() {
 const [currentMonth, setCurrentMonth] = useState(new Date());
 const [selectedListingId, setSelectedListingId] = useState<string>("");
 const [selectedDate, setSelectedDate] = useState<Date | null>(null);
 const { toast } = useToast();

 const { data, isLoading } = useQuery<CalendarData>({
 queryKey: ["/api/calendar"],
 });

 const autoSelectListing = useMemo(() => {
 if (!data?.listings?.length) return "";
 if (selectedListingId && data.listings.find((l) => l.id === selectedListingId))
 return selectedListingId;
 return data.listings[0].id;
 }, [data?.listings, selectedListingId]);

 const activeListingId = selectedListingId || autoSelectListing;

 const days = useMemo(() => {
 const start = startOfMonth(currentMonth);
 const end = endOfMonth(currentMonth);
 return eachDayOfInterval({ start, end });
 }, [currentMonth]);

 const startDayOfWeek = getDay(startOfMonth(currentMonth));

 const upcomingEvents = useMemo(() => getUpcomingEvents(8), []);

 const getDayStatus = (
 day: Date
 ): "available" | "blocked" | "reserved" => {
 if (!data || !activeListingId) return "available";
 const dateStr = format(day, "yyyy-MM-dd");
 const reservation = data.reservations.find(
 (r) =>
 r.listingId === activeListingId &&
 r.status === "CONFIRMED" &&
 dateStr >= r.checkIn &&
 dateStr < r.checkOut
 );
 if (reservation) return "reserved";

 const calDay = data.calendarDays.find(
 (cd) => cd.listingId === activeListingId && cd.date === dateStr
 );
 if (calDay?.status === "BLOCKED") return "blocked";

 return "available";
 };

 const getReservationForDay = (day: Date): Reservation | null => {
 if (!data || !activeListingId) return null;
 const dateStr = format(day, "yyyy-MM-dd");
 return (
 data.reservations.find(
 (r) =>
 r.listingId === activeListingId &&
 r.status === "CONFIRMED" &&
 dateStr >= r.checkIn &&
 dateStr < r.checkOut
 ) || null
 );
 };

 const maxMonth = addMonths(new Date(), 12);
 const bookableUntil = format(endOfMonth(addMonths(new Date(), 11)), "MMM yyyy");

 const canGoNext = isBefore(
 startOfMonth(addMonths(currentMonth, 1)),
 startOfMonth(maxMonth)
 );

 const blockMutation = useMutation({
 mutationFn: async ({
 listingId,
 date,
 block,
 }: {
 listingId: string;
 date: string;
 block: boolean;
 }) => {
 const res = await apiRequest("POST", "/api/calendar/block", {
 listingId,
 date,
 block,
 });
 return res.json();
 },
 onSuccess: (result) => {
 queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
 const channelResults = result?.channelResults as Array<{
 channelKey: string;
 channelName: string;
 success: boolean;
 error?: string;
 }> | undefined;

 if (channelResults && channelResults.length > 0) {
 const failed = channelResults.filter((r) => !r.success);
 if (failed.length > 0) {
 toast({
 title: "Calendar updated locally",
 description: `Failed to sync with: ${failed.map((f) => f.channelName).join(", ")}`,
 variant: "destructive",
 });
 } else {
 toast({
 title: "Calendar updated",
 description: `Synced to ${channelResults.map((r) => r.channelName).join(", ")}`,
 });
 }
 } else {
 toast({ title: "Calendar updated" });
 }
 },
 onError: () => {
 toast({
 title: "Failed to update calendar",
 variant: "destructive",
 });
 },
 });

 const handleDayClick = (day: Date) => {
 if (!activeListingId) return;
 const status = getDayStatus(day);
 if (status === "reserved") {
 setSelectedDate(day);
 return;
 }
 const dateStr = format(day, "yyyy-MM-dd");
 blockMutation.mutate({
 listingId: activeListingId,
 date: dateStr,
 block: status === "available",
 });
 };

 const activeListing = data?.listings.find((l) => l.id === activeListingId);

 if (isLoading) {
 return (
 <div className="px-4 py-4">
 <Skeleton className="mb-3 h-12 w-full rounded-full" />
 <Skeleton className="h-80 w-full rounded-md" />
 </div>
 );
 }

 return (
 <div className="px-4 py-4 pb-6">
 {data?.listings?.length ? (
 <Select
   value={activeListingId}
   onValueChange={setSelectedListingId}
 >
   <SelectTrigger
     className="mb-4 rounded-full h-12 px-5 text-base"
     data-testid="select-listing"
   >
     <SelectValue placeholder="Select a unit" />
   </SelectTrigger>
   <SelectContent>
     {data.listings.map((listing) => (
       <SelectItem
         key={listing.id}
         value={listing.id}
         data-testid={`select-listing-${listing.id}`}
       >
         {listing.name}
       </SelectItem>
     ))}
   </SelectContent>
 </Select>
 ) : (
 <div className="flex flex-col items-center justify-center py-12 text-center">
   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
     <CalendarDays className="h-6 w-6 text-muted-foreground" />
   </div>
   <h2 className="mb-1.5 text-sm font-semibold">No units yet</h2>
   <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed">
     Connect a channel and import units to view your booking calendar.
   </p>
 </div>
 )}

 {data?.listings?.length ? (
 <>
 {activeListing && (activeListing as any).channels?.length > 0 && (
 <div className="mb-3 flex flex-wrap gap-1.5">
 {(activeListing as any).channels.map(
 (ch: { channelKey: ChannelKey; channelName: string }) => (
 <ChannelBadge key={ch.channelKey} channelKey={ch.channelKey} />
 )
 )}
 </div>
 )}

 <Card className="p-4">
 <div className="flex items-center justify-between gap-2 mb-4">
 <Button
 size="icon"
 variant="ghost"
 onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
 data-testid="button-prev-month"
 >
 <ChevronLeft className="h-4 w-4" />
 </Button>
 <div className="flex items-center gap-2">
 <h2 className="text-sm font-semibold" data-testid="text-current-month">
 {format(currentMonth, "MMMM yyyy")}
 </h2>
 {format(currentMonth, "yyyy-MM") !== format(new Date(), "yyyy-MM") && (
 <Button
 size="sm"
 variant="outline"
 onClick={() => setCurrentMonth(new Date())}
 data-testid="button-today"
 >
 Today
 </Button>
 )}
 </div>
 <Button
 size="icon"
 variant="ghost"
 onClick={() => canGoNext && setCurrentMonth(addMonths(currentMonth, 1))}
 disabled={!canGoNext}
 data-testid="button-next-month"
 >
 <ChevronRight className="h-4 w-4" />
 </Button>
 </div>

 <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
 <Info className="h-3 w-3 flex-shrink-0" />
 <span>Tap a day to block/unblock. Bookable until {bookableUntil}</span>
 </div>

 <div className="grid grid-cols-7 mb-2">
 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
 <div
 key={`${d}-${i}`}
 className="py-2 text-center text-sm font-semibold text-foreground"
 >
 {d}
 </div>
 ))}
 </div>

 <div className="grid grid-cols-7 gap-1">
 {Array.from({ length: startDayOfWeek }).map((_, i) => (
 <div key={`empty-${i}`} className="h-10" />
 ))}
 {days.map((day) => {
 const status = getDayStatus(day);
 const today = isToday(day);
 const reservation = status === "reserved" ? getReservationForDay(day) : null;
 const channelKey = (reservation as any)?.channelKey as ChannelKey | undefined;

 return (
 <button
 key={day.toISOString()}
 onClick={() => handleDayClick(day)}
 disabled={blockMutation.isPending}
 className={cn(
 "relative flex h-10 items-center justify-center rounded-md text-sm font-medium transition-colors",
 status === "reserved" &&
 "bg-emerald-100 text-emerald-900 font-semibold",
 status === "blocked" &&
 "bg-gray-700 text-white",
 status === "available" &&
 "hover-elevate active-elevate-2",
 today && "ring-1 ring-foreground/20"
 )}
 data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
 >
 <span className={cn(today && "font-bold")}>
 {format(day, "d")}
 </span>
 {status === "reserved" && channelKey && (
 <span className="absolute bottom-0.5">
 <ChannelIcon channelKey={channelKey} size={10} />
 </span>
 )}
 {status === "reserved" && !channelKey && (
 <span className="absolute bottom-1 h-1 w-3 rounded-full bg-emerald-500/40" />
 )}
 {status === "blocked" && (
 <Lock className="absolute bottom-0.5 h-2.5 w-2.5 text-gray-300" />
 )}
 </button>
 );
 })}
 </div>

 <div className="mt-4 flex items-center gap-5 text-xs text-muted-foreground">
 <div className="flex items-center gap-1.5">
 <span className="h-2.5 w-2.5 rounded-full bg-emerald-200" />
 Booked
 </div>
 <div className="flex items-center gap-1.5">
 <span className="h-2.5 w-2.5 rounded-full bg-gray-700" />
 Blocked
 </div>
 <div className="flex items-center gap-1.5">
 <span className="h-2.5 w-2.5 rounded-full border" />
 Open
 </div>
 </div>
 </Card>

 {selectedDate && (
 (() => {
 const res = getReservationForDay(selectedDate);
 if (!res) {
 setSelectedDate(null);
 return null;
 }
 const nights = Math.ceil(
 (new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) /
 (1000 * 60 * 60 * 24)
 );
 return (
 <Card className="mt-3 p-4" data-testid="card-reservation-detail">
 <div className="flex items-center justify-between gap-2 mb-3">
 <div className="flex items-center gap-2.5">
 {(res as any).channelKey && (
 <ChannelBadge channelKey={(res as any).channelKey as ChannelKey} />
 )}
 <h3 className="text-sm font-semibold">{res.guestName}</h3>
 </div>
 <Button
 size="sm"
 variant="ghost"
 onClick={() => setSelectedDate(null)}
 data-testid="button-close-detail"
 >
 Close
 </Button>
 </div>
 <div className="grid grid-cols-3 gap-3 text-center">
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
 Check-in
 </p>
 <p className="text-sm font-semibold">
 {format(parseISO(res.checkIn), "MMM d")}
 </p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
 Check-out
 </p>
 <p className="text-sm font-semibold">
 {format(parseISO(res.checkOut), "MMM d")}
 </p>
 </div>
 <div>
 <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
 Nights
 </p>
 <p className="text-sm font-semibold">{nights}</p>
 </div>
 </div>
 {res.totalAmount && (
 <div className="mt-3 pt-3 border-t flex items-center justify-between">
 <span className="text-xs text-muted-foreground">Total</span>
 <span className="text-sm font-bold">
 {res.currency === "EUR" ? "\u20AC" : "$"}
 {!isNaN(parseFloat(res.totalAmount as any)) ? parseFloat(res.totalAmount as any).toLocaleString(undefined, { maximumFractionDigits: 0 }) : res.totalAmount}
 </span>
 </div>
 )}
 </Card>
 );
 })()
 )}

 </>
 ) : null}

 <Card className="mt-3 p-4" data-testid="card-upcoming-events">
 <div className="flex items-center justify-between gap-2 mb-3">
 <div className="flex items-center gap-1.5 text-muted-foreground">
 <Ticket className="h-3.5 w-3.5" />
 <span className="text-xs font-semibold uppercase tracking-wider">
 Upcoming Events
 </span>
 </div>
 <Badge variant="secondary">{upcomingEvents.length}</Badge>
 </div>
 <div className="space-y-2">
 {upcomingEvents.map((event, i) => {
 const Icon = getEventCategoryIcon(event.category);
 const colorClasses = getEventCategoryColor(event.category);
 const [iconColor, iconBg] = colorClasses.split(" ");
 const active = isEventActive(event);
 const start = new Date(event.startDate);
 const end = new Date(event.endDate);
 const sameDay = event.startDate === event.endDate;
 return (
 <div
 key={i}
 className={`flex items-start gap-3 p-2.5 rounded-md border ${active ? "border-primary/30 bg-primary/5" : ""}`}
 data-testid={`event-${i}`}
 >
 <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${iconBg}`}>
 <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <p className="text-sm font-semibold truncate" data-testid={`text-event-name-${i}`}>{event.name}</p>
 {active && (
 <Badge variant="secondary" className="text-[10px] py-0" data-testid={`badge-event-active-${i}`}>
 Live now
 </Badge>
 )}
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">
 {sameDay ? format(start, "MMM d, yyyy") : `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`}
 <span className="mx-1.5 opacity-30">|</span>
 {event.location}
 </p>
 <p className="text-xs text-muted-foreground/80 mt-0.5">{event.description}</p>
 </div>
 </div>
 );
 })}
 </div>
 </Card>
 </div>
 );
}
