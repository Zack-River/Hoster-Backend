import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Radio,
  UserPlus,
  CalendarCheck,
  MessageSquare,
  Wrench,
  Zap,
  AlertTriangle,
  Webhook,
  KeyRound,
  ListOrdered,
  PieChart,
} from "lucide-react";

interface ChannelDist {
  channelName: string;
  value: number;
}

interface AdminStats {
  users: {
    total: number;
    hosts: number;
    providers: number;
    admins: number;
  };
  newHosts: number;
  totalListings: number;
  activeConnections: number;
  totalBookings: number;
  totalMessages: number;
  totalWorkOrders: number;
  totalAutomations: number;
  syncErrors: number;
  webhookFailures: number;
  tokenExpiry: number;
  queueBacklog: number;
  channelDistribution: ChannelDist[];
}

function StatCard({ label, value, icon: Icon, color, bg, testId }: {
  label: string; value: number; icon: any; color: string; bg: string; testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const growthCards = [
    { label: "Users", value: data?.users?.total ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-500/12", testId: "card-stat-users" },
    { label: "Units", value: data?.totalListings ?? 0, icon: Building2, color: "text-teal-600", bg: "bg-teal-500/12", testId: "card-stat-units" },
    { label: "Channels", value: data?.activeConnections ?? 0, icon: Radio, color: "text-violet-600", bg: "bg-violet-500/12", testId: "card-stat-channels" },
    { label: "New Hosts", value: data?.newHosts ?? 0, icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-500/12", testId: "card-stat-new-hosts" },
  ];

  const activityCards = [
    { label: "Bookings", value: data?.totalBookings ?? 0, icon: CalendarCheck, color: "text-amber-600", bg: "bg-amber-500/12", testId: "card-stat-bookings" },
    { label: "Messages", value: data?.totalMessages ?? 0, icon: MessageSquare, color: "text-sky-600", bg: "bg-sky-500/12", testId: "card-stat-messages" },
    { label: "Work Orders", value: data?.totalWorkOrders ?? 0, icon: Wrench, color: "text-orange-600", bg: "bg-orange-500/12", testId: "card-stat-work-orders" },
    { label: "Automations", value: data?.totalAutomations ?? 0, icon: Zap, color: "text-purple-600", bg: "bg-purple-500/12", testId: "card-stat-automations" },
  ];

  const healthCards = [
    { label: "Sync Errors", value: data?.syncErrors ?? 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/12", testId: "card-stat-sync-errors" },
    { label: "Webhook Failures", value: data?.webhookFailures ?? 0, icon: Webhook, color: "text-rose-600", bg: "bg-rose-500/12", testId: "card-stat-webhook-failures" },
    { label: "Token Expiry", value: data?.tokenExpiry ?? 0, icon: KeyRound, color: "text-yellow-600", bg: "bg-yellow-500/12", testId: "card-stat-token-expiry" },
    { label: "Queue Backlog", value: data?.queueBacklog ?? 0, icon: ListOrdered, color: "text-slate-600", bg: "bg-slate-500/12", testId: "card-stat-queue-backlog" },
  ];

  const renderCards = (cards: typeof growthCards) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((stat) =>
        isLoading ? (
          <Skeleton key={stat.testId} className="h-24 w-full rounded-md" />
        ) : (
          <StatCard key={stat.testId} {...stat} />
        )
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold" data-testid="text-dashboard-title">Dashboard</h2>

      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Growth</h3>
        {renderCards(growthCards)}
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
        {renderCards(activityCards)}
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Health</h3>
        {renderCards(healthCards)}
      </div>

      {data && (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card data-testid="card-user-breakdown">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Hosts</span>
                  <Badge variant="secondary" data-testid="text-hosts-count">{data.users.hosts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Providers</span>
                  <Badge variant="secondary" data-testid="text-providers-count">{data.users.providers}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Admins</span>
                  <Badge variant="secondary" data-testid="text-admins-count">{data.users.admins}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-channel-distribution">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Channel Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.channelDistribution && data.channelDistribution.length > 0 ? (
                  data.channelDistribution.map((ch) => (
                    <div key={ch.channelName} className="flex items-center justify-between">
                      <span className="text-sm">{ch.channelName}</span>
                      <Badge variant="secondary">{ch.value}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No active channels</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
