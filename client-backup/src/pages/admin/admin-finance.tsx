import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DollarSign,
  TrendingUp,
  Users,
  UserPlus,
  Crown,
  ChevronDown,
  ChevronUp,
  Home,
  Percent,
  Wallet,
} from "lucide-react";

interface PlanDistribution {
  plan: string;
  name: string;
  price: number;
  count: number;
}

interface Subscriber {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  plan: string;
  planName: string;
  price: number;
  unitCount: number;
  maxUnits: number;
  createdAt: string | null;
}

interface FinanceData {
  overview: {
    mrr: number;
    arr: number;
    totalSubscribers: number;
    paidSubscribers: number;
    freeSubscribers: number;
    newSubscribers: number;
    totalRevenue: number;
    providerCommission: number;
  };
  planDistribution: PlanDistribution[];
  subscribers: Subscriber[];
}

const planColors: Record<string, string> = {
  light: "#94a3b8",
  growth: "#3b82f6",
  expanding: "#8b5cf6",
};

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName || lastName) {
    return [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase();
  }
  return email[0].toUpperCase();
}

function getDisplayName(firstName: string | null, lastName: string | null, email: string): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : email;
}

type TabKey = "overview" | "subscribers";

export default function AdminFinance() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<FinanceData>({
    queryKey: ["/api/admin/finance"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold">Finance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "subscribers", label: "Subscribers" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold" data-testid="text-finance-title">Finance</h2>
        <Badge variant="secondary" data-testid="badge-subscription-model">
          Subscription Revenue
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/12">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-revenue">
              {formatCurrency(overview?.totalRevenue ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All-time booking revenue</p>
          </CardContent>
        </Card>

        <Card data-testid="card-mrr">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/12">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-mrr">
              {formatCurrency(overview?.mrr ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Monthly recurring revenue</p>
          </CardContent>
        </Card>

        <Card data-testid="card-arr">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/12">
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-arr">
              {formatCurrency(overview?.arr ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Annual recurring revenue</p>
          </CardContent>
        </Card>

        <Card data-testid="card-provider-commission">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provider Commission</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/12">
              <Percent className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-provider-commission">
              {formatCurrency(overview?.providerCommission ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Est. provider payouts</p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-subscribers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Hosts</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/12">
              <Users className="h-4 w-4 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-total-subscribers">
              {overview?.totalSubscribers ?? 0}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{overview?.paidSubscribers ?? 0} paid</span>
              <span className="text-xs text-muted-foreground">{overview?.freeSubscribers ?? 0} free</span>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-new-subscribers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New (30d)</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/12">
              <UserPlus className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-new-subscribers">
              {overview?.newSubscribers ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`tab-${tab.key}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <Card data-testid="card-plan-distribution">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.planDistribution?.map((pd) => {
                const total = data.planDistribution.reduce((a, b) => a + b.count, 0) || 1;
                const pct = Math.round((pd.count / total) * 100);
                return (
                  <div key={pd.plan} data-testid={`plan-dist-${pd.plan}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" style={{ color: planColors[pd.plan] || "#94a3b8" }} />
                        <span className="text-sm font-medium">{pd.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {pd.price === 0 ? "Free" : `$${pd.price}/mo`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">{pd.count} hosts</span>
                        <span className="font-medium">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-visible">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          backgroundColor: planColors[pd.plan] || "#94a3b8",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "subscribers" && (
        <div className="space-y-2">
          {data?.subscribers && data.subscribers.length > 0 ? (
            data.subscribers.map((sub) => {
              const isExpanded = expandedUserId === sub.userId;
              return (
                <Card key={sub.userId} data-testid={`card-sub-${sub.userId}`}>
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => setExpandedUserId(isExpanded ? null : sub.userId)}
                    data-testid={`row-sub-${sub.userId}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(sub.firstName, sub.lastName, sub.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {getDisplayName(sub.firstName, sub.lastName, sub.email)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {sub.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          borderColor: planColors[sub.plan],
                          color: planColors[sub.plan],
                        }}
                      >
                        {sub.planName}
                      </Badge>
                      <span className="text-sm font-semibold" data-testid={`text-sub-price-${sub.userId}`}>
                        {sub.price === 0 ? "Free" : `$${sub.price}/mo`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Plan</p>
                          <p className="font-medium">{sub.planName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Price</p>
                          <p className="font-medium">{sub.price === 0 ? "Free" : `$${sub.price}/mo`}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Units</p>
                          <div className="flex items-center gap-1">
                            <Home className="h-3 w-3 text-muted-foreground" />
                            <p className="font-medium">{sub.unitCount} / {sub.maxUnits}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Joined</p>
                          <p className="font-medium">
                            {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-subscribers">
              No subscribers yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
