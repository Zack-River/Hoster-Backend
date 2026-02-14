import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Wrench,
  Sparkles as SparklesIcon,
  Plus,
  ClipboardList,
  Check,
  X,
  Trash2,
  Mail,
  Phone,
  Building2,
  Percent,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ServiceProvider {
  id: string;
  name: string;
  type: "CLEANING" | "MAINTENANCE";
  email: string | null;
  phone: string | null;
  companyName: string | null;
  description: string | null;
  profileImageUrl: string | null;
  commissionRate: string | null;
  status: string;
  createdAt: string | null;
}

interface ProviderRequest {
  id: string;
  name: string;
  type: "CLEANING" | "MAINTENANCE";
  email: string | null;
  phone: string | null;
  companyName: string | null;
  message: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string | null;
}

interface Promotion {
  id: string;
  providerId: string;
  title: string;
  description: string | null;
  discountPercent: string | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
}

type TabKey = "providers" | "requests" | "promotions";

const typeIcons = {
  CLEANING: SparklesIcon,
  MAINTENANCE: Wrench,
};

const typeColors = {
  CLEANING: "text-blue-600",
  MAINTENANCE: "text-amber-600",
};

const typeBg = {
  CLEANING: "bg-blue-500/12",
  MAINTENANCE: "bg-amber-500/12",
};

export default function AdminProviders() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("providers");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [showAddPromo, setShowAddPromo] = useState<string | null>(null);

  const [newProvider, setNewProvider] = useState({
    name: "", type: "CLEANING" as "CLEANING" | "MAINTENANCE",
    email: "", phone: "", companyName: "", description: "", commissionRate: "10",
  });

  const [newRequest, setNewRequest] = useState({
    name: "", type: "CLEANING" as "CLEANING" | "MAINTENANCE",
    email: "", phone: "", companyName: "", message: "",
  });

  const [newPromo, setNewPromo] = useState({
    title: "", description: "", discountPercent: "", validFrom: "", validUntil: "",
  });

  const providerUrl = typeFilter !== "all" ? `/api/admin/providers?type=${typeFilter}` : "/api/admin/providers";
  const { data: providers, isLoading: loadingProviders } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/admin/providers", { type: typeFilter }],
    queryFn: async () => {
      const res = await fetch(providerUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: requests, isLoading: loadingRequests } = useQuery<ProviderRequest[]>({
    queryKey: ["/api/admin/provider-requests"],
  });

  const pendingRequests = requests?.filter(r => r.status === "PENDING") ?? [];

  const createProvider = useMutation({
    mutationFn: async (data: typeof newProvider) => {
      const res = await apiRequest("POST", "/api/admin/providers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      setShowAddProvider(false);
      setNewProvider({ name: "", type: "CLEANING", email: "", phone: "", companyName: "", description: "", commissionRate: "10" });
      toast({ title: "Provider added" });
    },
  });

  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      toast({ title: "Provider removed" });
    },
  });

  const createRequest = useMutation({
    mutationFn: async (data: typeof newRequest) => {
      const res = await apiRequest("POST", "/api/admin/provider-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/provider-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setShowAddRequest(false);
      setNewRequest({ name: "", type: "CLEANING", email: "", phone: "", companyName: "", message: "" });
      toast({ title: "Request submitted" });
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) => {
      const res = await apiRequest("PATCH", `/api/admin/provider-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/provider-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Request updated" });
    },
  });

  const createPromotion = useMutation({
    mutationFn: async ({ providerId, data }: { providerId: string; data: typeof newPromo }) => {
      const res = await apiRequest("POST", `/api/admin/providers/${providerId}/promotions`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
      setShowAddPromo(null);
      setNewPromo({ title: "", description: "", discountPercent: "", validFrom: "", validUntil: "" });
      toast({ title: "Promotion added" });
    },
  });

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "providers", label: "Providers" },
    { key: "requests", label: "Requests", count: pendingRequests.length },
    { key: "promotions", label: "Promotions" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold" data-testid="text-providers-title">Providers</h2>
      </div>

      <div className="flex items-center gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
            onClick={() => setActiveTab(tab.key)}
            data-testid={`tab-${tab.key}`}
          >
            {tab.label}
            {tab.count && tab.count > 0 ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{tab.count}</Badge>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === "providers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]" data-testid="select-type-filter">
                <SelectValue placeholder="Filter type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CLEANING">Cleaning</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddProvider(true)} data-testid="button-add-provider">
              <Plus className="h-4 w-4 mr-1" /> Add Provider
            </Button>
          </div>

          {loadingProviders ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
            </div>
          ) : providers && providers.length > 0 ? (
            <div className="space-y-3">
              {providers.map((p) => {
                const Icon = typeIcons[p.type];
                const isExpanded = expandedProviderId === p.id;
                return (
                  <Card key={p.id} data-testid={`card-provider-${p.id}`}>
                    <div className="flex items-center gap-3 p-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className={`text-xs font-semibold ${typeBg[p.type]}`}>
                          <Icon className={`h-4 w-4 ${typeColors[p.type]}`} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{p.name}</p>
                          <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
                          {p.status === "inactive" && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                        </div>
                        {p.companyName && <p className="text-xs text-muted-foreground mt-0.5">{p.companyName}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground">{p.commissionRate || "10"}%</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setExpandedProviderId(isExpanded ? null : p.id)}
                          data-testid={`button-expand-${p.id}`}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteProvider.mutate(p.id)}
                          data-testid={`button-delete-provider-${p.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t px-4 py-3 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm truncate">{p.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{p.phone || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm truncate">{p.companyName || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">Commission: {p.commissionRate || "10"}%</span>
                          </div>
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowAddPromo(p.id)} data-testid={`button-add-promo-${p.id}`}>
                            <Tag className="h-3.5 w-3.5 mr-1" /> Add Promotion
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-providers">
              No providers yet. Add your first provider to get started.
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddRequest(true)} data-testid="button-new-request">
              <Plus className="h-4 w-4 mr-1" /> New Request
            </Button>
          </div>
          {loadingRequests ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
            </div>
          ) : requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((r) => {
                const Icon = typeIcons[r.type];
                return (
                  <Card key={r.id} data-testid={`card-request-${r.id}`}>
                    <div className="flex items-center gap-3 p-4">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className={`text-xs ${typeBg[r.type]}`}>
                          <Icon className={`h-4 w-4 ${typeColors[r.type]}`} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{r.name}</p>
                          <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.email || r.phone || r.companyName || "No contact info"}
                        </p>
                        {r.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.message}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {r.status === "PENDING" ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => updateRequest.mutate({ id: r.id, status: "APPROVED" })}
                              data-testid={`button-approve-${r.id}`}
                            >
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => updateRequest.mutate({ id: r.id, status: "REJECTED" })}
                              data-testid={`button-reject-${r.id}`}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <Badge variant={r.status === "APPROVED" ? "default" : "destructive"} className="text-[10px]">
                            {r.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-requests">
              No provider requests yet
            </div>
          )}
        </div>
      )}

      {activeTab === "promotions" && (
        <div className="space-y-4">
          {providers && providers.length > 0 ? (
            providers.map((p) => (
              <ProviderPromotionsCard key={p.id} provider={p} onAddPromo={() => setShowAddPromo(p.id)} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-promos">
              Add providers first to manage their promotions
            </div>
          )}
        </div>
      )}

      <Dialog open={showAddProvider} onOpenChange={setShowAddProvider}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Provider name" value={newProvider.name} onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })} data-testid="input-provider-name" />
            <Select value={newProvider.type} onValueChange={(v) => setNewProvider({ ...newProvider, type: v as "CLEANING" | "MAINTENANCE" })}>
              <SelectTrigger data-testid="select-provider-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEANING">Cleaning</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Email" value={newProvider.email} onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })} data-testid="input-provider-email" />
            <Input placeholder="Phone" value={newProvider.phone} onChange={(e) => setNewProvider({ ...newProvider, phone: e.target.value })} data-testid="input-provider-phone" />
            <Input placeholder="Company name" value={newProvider.companyName} onChange={(e) => setNewProvider({ ...newProvider, companyName: e.target.value })} data-testid="input-provider-company" />
            <Textarea placeholder="Description" value={newProvider.description} onChange={(e) => setNewProvider({ ...newProvider, description: e.target.value })} data-testid="input-provider-desc" />
            <Input placeholder="Commission rate (%)" value={newProvider.commissionRate} onChange={(e) => setNewProvider({ ...newProvider, commissionRate: e.target.value })} data-testid="input-provider-commission" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProvider(false)}>Cancel</Button>
            <Button onClick={() => createProvider.mutate(newProvider)} disabled={!newProvider.name || createProvider.isPending} data-testid="button-save-provider">
              {createProvider.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddRequest} onOpenChange={setShowAddRequest}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Provider Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Provider name" value={newRequest.name} onChange={(e) => setNewRequest({ ...newRequest, name: e.target.value })} data-testid="input-request-name" />
            <Select value={newRequest.type} onValueChange={(v) => setNewRequest({ ...newRequest, type: v as "CLEANING" | "MAINTENANCE" })}>
              <SelectTrigger data-testid="select-request-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CLEANING">Cleaning</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Email" value={newRequest.email} onChange={(e) => setNewRequest({ ...newRequest, email: e.target.value })} data-testid="input-request-email" />
            <Input placeholder="Phone" value={newRequest.phone} onChange={(e) => setNewRequest({ ...newRequest, phone: e.target.value })} data-testid="input-request-phone" />
            <Input placeholder="Company name" value={newRequest.companyName} onChange={(e) => setNewRequest({ ...newRequest, companyName: e.target.value })} data-testid="input-request-company" />
            <Textarea placeholder="Message" value={newRequest.message} onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })} data-testid="input-request-message" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddRequest(false)}>Cancel</Button>
            <Button onClick={() => createRequest.mutate(newRequest)} disabled={!newRequest.name || createRequest.isPending} data-testid="button-save-request">
              {createRequest.isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddPromo} onOpenChange={() => setShowAddPromo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Promotion</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Promotion title" value={newPromo.title} onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })} data-testid="input-promo-title" />
            <Textarea placeholder="Description" value={newPromo.description} onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })} data-testid="input-promo-desc" />
            <Input placeholder="Discount (%)" value={newPromo.discountPercent} onChange={(e) => setNewPromo({ ...newPromo, discountPercent: e.target.value })} data-testid="input-promo-discount" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valid from</label>
                <Input type="date" value={newPromo.validFrom} onChange={(e) => setNewPromo({ ...newPromo, validFrom: e.target.value })} data-testid="input-promo-from" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Valid until</label>
                <Input type="date" value={newPromo.validUntil} onChange={(e) => setNewPromo({ ...newPromo, validUntil: e.target.value })} data-testid="input-promo-until" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPromo(null)}>Cancel</Button>
            <Button
              onClick={() => showAddPromo && createPromotion.mutate({ providerId: showAddPromo, data: newPromo })}
              disabled={!newPromo.title || createPromotion.isPending}
              data-testid="button-save-promo"
            >
              {createPromotion.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProviderPromotionsCard({ provider, onAddPromo }: { provider: ServiceProvider; onAddPromo: () => void }) {
  const { toast } = useToast();
  const { data: promos, isLoading } = useQuery<Promotion[]>({
    queryKey: ["/api/admin/providers", provider.id, "promotions"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/providers/${provider.id}/promotions`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/promotions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/providers", provider.id, "promotions"] });
      toast({ title: "Promotion removed" });
    },
  });

  const Icon = typeIcons[provider.type];

  return (
    <Card data-testid={`card-promos-${provider.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${typeColors[provider.type]}`} />
          <CardTitle className="text-sm font-medium">{provider.name}</CardTitle>
          <Badge variant="secondary" className="text-[10px]">{provider.type}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onAddPromo} data-testid={`button-add-promo-tab-${provider.id}`}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : promos && promos.length > 0 ? (
          <div className="space-y-2">
            {promos.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{promo.title}</span>
                    {promo.discountPercent && (
                      <Badge variant="secondary" className="text-[10px]">{promo.discountPercent}% off</Badge>
                    )}
                  </div>
                  {promo.validFrom && promo.validUntil && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                      {new Date(promo.validFrom).toLocaleDateString()} - {new Date(promo.validUntil).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => deletePromo.mutate(promo.id)} data-testid={`button-delete-promo-${promo.id}`}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No promotions yet</p>
        )}
      </CardContent>
    </Card>
  );
}
