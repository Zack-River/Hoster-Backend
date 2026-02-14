import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  CalendarCheck,
  CreditCard,
  Radio,
} from "lucide-react";
import { format } from "date-fns";

interface UserDetail {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    country: string | null;
    phone: string | null;
    profileImageUrl: string | null;
    companyName: string | null;
    crNumber: string | null;
    role: string;
    subscriptionPlan: string;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
  };
  listings: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    reservationCount: number;
  }>;
  channelConnections: Array<{
    id: string;
    channelName: string;
    channelKey: string;
    status: string;
    lastSyncAt: string | null;
    lastError: string | null;
  }>;
  recentReservations: Array<{
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    status: string;
    totalAmount: string | null;
    currency: string | null;
    channelName: string;
    listingName: string;
  }>;
}

function getPlanInfo(plan: string) {
  switch (plan) {
    case "growth": return { label: "Growth", price: "$19/mo", maxUnits: 5, variant: "default" as const };
    case "expanding": return { label: "Expanding", price: "$39/mo", maxUnits: 15, variant: "destructive" as const };
    default: return { label: "Light", price: "Free", maxUnits: 1, variant: "secondary" as const };
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "CONFIRMED": case "CHECKED_IN": return "default" as const;
    case "CANCELED": case "REJECTED": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default function AdminUserDetail() {
  const [, params] = useRoute("/admin/users/:id");
  const [, navigate] = useLocation();
  const userId = params?.id;

  const { data, isLoading } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const { user, listings, channelConnections, recentReservations } = data;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initials = user.firstName ? (user.firstName[0] + (user.lastName?.[0] || "")).toUpperCase() : user.email[0].toUpperCase();
  const planInfo = getPlanInfo(user.subscriptionPlan);
  const joinedDate = user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A";

  const totalRevenue = recentReservations.reduce((sum, r) => sum + parseFloat(r.totalAmount as any || "0"), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/users")}
          data-testid="button-back-users"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold" data-testid="text-user-detail-title">User Details</h2>
      </div>

      <Card data-testid="card-user-profile">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-20 w-20 flex-shrink-0">
              {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} alt={displayName} />}
              <AvatarFallback className="text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold" data-testid="text-user-display-name">{displayName}</h3>
                  <Badge variant="secondary" data-testid="badge-user-role">{user.role}</Badge>
                  <Badge variant={planInfo.variant} data-testid="badge-user-plan">{planInfo.label}</Badge>
                  {user.blocked && <Badge variant="destructive">Blocked</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Joined {joinedDate}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate" data-testid="text-user-email">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span data-testid="text-user-phone">{user.phone}</span>
                  </div>
                )}
                {user.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span data-testid="text-user-country">{user.country}</span>
                  </div>
                )}
                {user.companyName && (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span data-testid="text-user-company">{user.companyName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-subscription-info">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription & Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-sm font-medium" data-testid="text-subscription-plan">{planInfo.label}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-sm font-medium" data-testid="text-subscription-price">{planInfo.price}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Max Units</p>
              <p className="text-sm font-medium" data-testid="text-max-units">{planInfo.maxUnits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Units Used</p>
              <p className="text-sm font-medium" data-testid="text-units-used">{listings.length} / {planInfo.maxUnits}</p>
            </div>
          </div>
          {planInfo.price !== "Free" && (
            <div className="mt-4 p-3 rounded-md bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Booking Volume</span>
                <span className="text-sm font-medium" data-testid="text-booking-volume">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-user-units">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Units ({listings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length > 0 ? (
            <div className="space-y-3">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-listing-${listing.id}`}>
                  <div>
                    <p className="text-sm font-medium">{listing.name}</p>
                    <p className="text-xs text-muted-foreground">{listing.reservationCount} bookings</p>
                  </div>
                  <Badge variant={listing.status === "ACTIVE" ? "default" : "secondary"}>
                    {listing.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No units</p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-user-channels">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Channels ({channelConnections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {channelConnections.length > 0 ? (
            <div className="space-y-3">
              {channelConnections.map((conn) => (
                <div key={conn.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-channel-${conn.id}`}>
                  <div>
                    <p className="text-sm font-medium">{conn.channelName}</p>
                    {conn.lastSyncAt && (
                      <p className="text-xs text-muted-foreground">
                        Last sync: {format(new Date(conn.lastSyncAt), "MMM d, yyyy HH:mm")}
                      </p>
                    )}
                  </div>
                  <Badge variant={conn.status === "CONNECTED" ? "default" : conn.status === "ERROR" ? "destructive" : "secondary"}>
                    {conn.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No channels connected</p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="card-user-reservations">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Recent Bookings ({recentReservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentReservations.length > 0 ? (
            <div className="space-y-3">
              {recentReservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50" data-testid={`row-reservation-${res.id}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{res.guestName}</p>
                      <Badge variant={getStatusVariant(res.status)} className="text-xs">{res.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {res.listingName} via {res.channelName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(res.checkIn), "MMM d")} - {format(new Date(res.checkOut), "MMM d, yyyy")}
                    </p>
                  </div>
                  {res.totalAmount && (
                    <p className="text-sm font-medium flex-shrink-0 ml-3">
                      {res.currency || "$"}{parseFloat(res.totalAmount as any).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No bookings yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
