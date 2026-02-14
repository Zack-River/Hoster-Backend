import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  Building2,
  Check,
  Clock,
  XCircle,
  Send,
  Image,
  MessageSquare,
  Loader2,
} from "lucide-react";

type Provider = {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  profileImageUrl: string | null;
  avgRating: number;
  reviewCount: number;
};

type Subscription = {
  id: string;
  hostId: string;
  providerId: string;
  listingIds: string[];
  termsAccepted: boolean;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  declineMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  provider: Provider | null;
  listings: { id: string; name: string }[];
};

type VisitReport = {
  id: string;
  subscriptionId: string;
  providerId: string;
  listingId: string;
  photos: string[];
  notes: string | null;
  visitDate: string;
  createdAt: string | null;
  listingName: string;
  review: { id: string; rating: number; comment: string | null; createdAt: string | null } | null;
};

type ChatMessage = {
  id: string;
  subscriptionId: string;
  senderId: string;
  senderType: "HOST" | "PROVIDER";
  body: string;
  sentAt: string | null;
};

type Listing = {
  id: string;
  name: string;
};

type ViewMode = "list" | "provider-detail" | "subscription-detail" | "visit-photos" | "review-form" | "chat";

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${iconSize} ${i <= Math.round(rating) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-0.5"
          data-testid={`star-rate-${i}`}
        >
          <Star className={`h-7 w-7 ${i <= value ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

export default function SettingsCleaningPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<ViewMode>("list");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [selectedReport, setSelectedReport] = useState<VisitReport | null>(null);
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  const { data: providers, isLoading: loadingProviders } = useQuery<Provider[]>({
    queryKey: ["/api/cleaning/providers"],
  });

  const { data: subscriptions, isLoading: loadingSubs } = useQuery<Subscription[]>({
    queryKey: ["/api/cleaning/my-subscriptions"],
  });

  const { data: myListings } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });

  const { data: visitReports, isLoading: loadingReports } = useQuery<VisitReport[]>({
    queryKey: ["/api/cleaning/visit-reports", selectedSub?.id],
    queryFn: async () => {
      const res = await fetch(`/api/cleaning/visit-reports/${selectedSub!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load visit reports");
      return res.json();
    },
    enabled: !!selectedSub?.id,
  });

  const { data: chatMessages } = useQuery<ChatMessage[]>({
    queryKey: ["/api/cleaning/messages", selectedSub?.id],
    queryFn: async () => {
      const res = await fetch(`/api/cleaning/messages/${selectedSub!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
    enabled: !!selectedSub?.id && view === "chat",
    refetchInterval: 5000,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: { providerId: string; listingIds: string[]; termsAccepted: true }) => {
      const res = await apiRequest("POST", "/api/cleaning/subscribe", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cleaning/my-subscriptions"] });
      setSubscribeDialogOpen(false);
      setSelectedListingIds([]);
      setTermsAccepted(false);
      toast({ title: "Request sent", description: "Your subscription request has been sent. You'll hear back within 24 hours." });
      setView("list");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to subscribe", variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { visitReportId: string; subscriptionId: string; providerId: string; rating: number; comment?: string }) => {
      const res = await apiRequest("POST", "/api/cleaning/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cleaning/visit-reports", selectedSub?.id] });
      toast({ title: "Review submitted", description: "Thank you for your feedback." });
      setView("subscription-detail");
      setReviewRating(0);
      setReviewComment("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit review", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ subscriptionId, body }: { subscriptionId: string; body: string }) => {
      const res = await apiRequest("POST", `/api/cleaning/messages/${subscriptionId}`, { body });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/cleaning/messages", selectedSub?.id] });
      setChatInput("");
    },
  });

  const getSubForProvider = (providerId: string) =>
    subscriptions?.find((s) => s.providerId === providerId);

  const goBack = () => {
    if (view === "chat" || view === "visit-photos" || view === "review-form") {
      setView("subscription-detail");
    } else if (view === "subscription-detail") {
      setView("list");
      setSelectedSub(null);
    } else if (view === "provider-detail") {
      setView("list");
      setSelectedProvider(null);
    } else {
      setLocation("/settings");
    }
  };

  const getTitle = () => {
    if (view === "provider-detail" && selectedProvider) return selectedProvider.companyName || `${selectedProvider.firstName} ${selectedProvider.lastName}`;
    if (view === "subscription-detail" && selectedSub) return selectedSub.provider?.companyName || "Subscription";
    if (view === "visit-photos") return "Visit Photos";
    if (view === "review-form") return "Leave Review";
    if (view === "chat") return "Chat";
    return "Cleaning Services";
  };

  return (
    <div className="pb-8 h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b sticky top-0 bg-background z-50">
        <Button size="icon" variant="ghost" onClick={goBack} data-testid="button-back-cleaning">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold" data-testid="text-cleaning-title">{getTitle()}</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "list" && (
          <div className="px-4 py-4 space-y-6">
            {subscriptions && subscriptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-3" data-testid="text-my-subscriptions">My Subscriptions</p>
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className={`p-3.5 rounded-md border cursor-pointer ${
                        sub.status === "PENDING" ? "border-amber-300 bg-amber-50" :
                        sub.status === "DECLINED" ? "border-red-200 bg-red-50" :
                        "border-green-300 bg-green-50"
                      }`}
                      onClick={() => { setSelectedSub(sub); setView("subscription-detail"); }}
                      data-testid={`subscription-card-${sub.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className={
                            sub.status === "ACCEPTED" ? "bg-green-200 text-green-800" :
                            sub.status === "DECLINED" ? "bg-red-200 text-red-800" :
                            "bg-amber-200 text-amber-800"
                          }>
                            {sub.status === "PENDING" ? <Clock className="h-4 w-4" /> :
                             sub.status === "ACCEPTED" ? <Check className="h-4 w-4" /> :
                             <XCircle className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{sub.provider?.companyName || `${sub.provider?.firstName || ""} ${sub.provider?.lastName || ""}`}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sub.listings.map(l => l.name).join(", ")}
                          </p>
                        </div>
                        <Badge variant={
                          sub.status === "PENDING" ? "secondary" :
                          sub.status === "ACCEPTED" ? "default" : "destructive"
                        } data-testid={`subscription-status-${sub.id}`}>
                          {sub.status === "PENDING" ? "Waiting" :
                           sub.status === "ACCEPTED" ? "Active" : "Declined"}
                        </Badge>
                      </div>
                      {sub.status === "PENDING" && (
                        <p className="text-xs text-amber-700 mt-2">
                          Will respond within 24 hours. Your unit locations have been shared with the provider.
                        </p>
                      )}
                      {sub.status === "DECLINED" && sub.declineMessage && (
                        <p className="text-xs text-red-700 mt-2">
                          {sub.declineMessage}
                        </p>
                      )}
                      {sub.status === "DECLINED" && !sub.declineMessage && (
                        <p className="text-xs text-red-700 mt-2">
                          Provider apologized for not being available to help you at this time.
                        </p>
                      )}
                      {sub.status === "ACCEPTED" && (
                        <p className="text-xs text-green-700 mt-2">
                          Provider is happy to serve you.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-3" data-testid="text-browse-providers">Browse Providers</p>
              {loadingProviders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-md" />)}
                </div>
              ) : providers && providers.length > 0 ? (
                <div className="space-y-3">
                  {providers.map((p) => {
                    const existingSub = getSubForProvider(p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-md border hover-elevate cursor-pointer"
                        onClick={() => { setSelectedProvider(p); setView("provider-detail"); }}
                        data-testid={`provider-card-${p.id}`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>{(p.companyName || p.firstName || "P")[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{p.companyName || `${p.firstName || ""} ${p.lastName || ""}`}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {p.avgRating > 0 && (
                                <span className="flex items-center gap-1 text-xs">
                                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                  {p.avgRating}
                                </span>
                              )}
                              {p.reviewCount > 0 && (
                                <span className="text-xs text-muted-foreground">{p.reviewCount} reviews</span>
                              )}
                              {p.phone && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {p.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          {existingSub && (
                            <Badge variant={existingSub.status === "ACCEPTED" ? "default" : existingSub.status === "PENDING" ? "secondary" : "destructive"} className="shrink-0">
                              {existingSub.status === "ACCEPTED" ? "Active" : existingSub.status === "PENDING" ? "Pending" : "Declined"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8" data-testid="text-no-providers">No cleaning providers available yet.</p>
              )}
            </div>
          </div>
        )}

        {view === "provider-detail" && selectedProvider && (
          <div className="px-4 py-4 space-y-4">
            <Card>
              <div className="p-6 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-3">
                  <AvatarFallback className="text-2xl">{(selectedProvider.companyName || selectedProvider.firstName || "P")[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-bold" data-testid="text-provider-name">
                  {selectedProvider.companyName || `${selectedProvider.firstName} ${selectedProvider.lastName}`}
                </h2>
                {selectedProvider.avgRating > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <StarRating rating={selectedProvider.avgRating} size="md" />
                    <span className="text-sm text-muted-foreground">({selectedProvider.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold">Contact Information</p>
                {selectedProvider.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{selectedProvider.email}</span>
                  </div>
                )}
                {selectedProvider.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{selectedProvider.phone}</span>
                  </div>
                )}
                {selectedProvider.companyName && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{selectedProvider.companyName}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-4 space-y-3">
                <p className="text-sm font-semibold">Service Offer</p>
                <p className="text-sm text-muted-foreground">Professional cleaning services for short-term rental properties. Includes post-checkout cleaning, linen changes, and property condition reporting with photo documentation.</p>
                <Separator />
                <p className="text-sm font-semibold">Terms & Conditions</p>
                <ul className="text-xs text-muted-foreground space-y-1.5">
                  <li>Service availability within 24 hours of request acceptance</li>
                  <li>Photo documentation of property condition after each visit (minimum 8 photos)</li>
                  <li>Host can review and rate each cleaning visit</li>
                  <li>Provider will have access to your property location details</li>
                  <li>Either party may end the arrangement at any time</li>
                </ul>
              </div>
            </Card>

            {(() => {
              const existingSub = getSubForProvider(selectedProvider.id);
              if (existingSub) {
                return (
                  <div className={`p-4 rounded-md ${
                    existingSub.status === "PENDING" ? "bg-amber-50 border border-amber-300" :
                    existingSub.status === "ACCEPTED" ? "bg-green-50 border border-green-300" :
                    "bg-red-50 border border-red-200"
                  }`} data-testid="subscription-status-banner">
                    <div className="flex items-center gap-2">
                      {existingSub.status === "PENDING" && <Clock className="h-4 w-4 text-amber-600" />}
                      {existingSub.status === "ACCEPTED" && <Check className="h-4 w-4 text-green-600" />}
                      {existingSub.status === "DECLINED" && <XCircle className="h-4 w-4 text-red-600" />}
                      <p className="text-sm font-medium">
                        {existingSub.status === "PENDING" && "Waiting for provider to accept your request"}
                        {existingSub.status === "ACCEPTED" && "Provider is happy to serve you"}
                        {existingSub.status === "DECLINED" && "Provider apologized for not being available"}
                      </p>
                    </div>
                    {existingSub.status === "PENDING" && (
                      <p className="text-xs text-amber-700 mt-1">Will respond within 24 hours. Your unit locations have been shared with the provider.</p>
                    )}
                    {existingSub.status === "DECLINED" && existingSub.declineMessage && (
                      <p className="text-xs text-red-700 mt-1">{existingSub.declineMessage}</p>
                    )}
                  </div>
                );
              }
              return (
                <Button
                  className="w-full"
                  onClick={() => setSubscribeDialogOpen(true)}
                  data-testid="button-subscribe-provider"
                >
                  Subscribe to this provider
                </Button>
              );
            })()}

            <Dialog open={subscribeDialogOpen} onOpenChange={setSubscribeDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Subscribe to Cleaning Service</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Select properties to include</p>
                    {myListings && myListings.length > 0 ? (
                      <div className="space-y-2">
                        {myListings.map((listing) => (
                          <label key={listing.id} className="flex items-center gap-2 p-2 rounded-md border cursor-pointer" data-testid={`listing-select-${listing.id}`}>
                            <Checkbox
                              checked={selectedListingIds.includes(listing.id)}
                              onCheckedChange={(checked) => {
                                setSelectedListingIds(prev =>
                                  checked ? [...prev, listing.id] : prev.filter(id => id !== listing.id)
                                );
                              }}
                            />
                            <span className="text-sm">{listing.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No listings found. Add listings first.</p>
                    )}
                  </div>
                  <Separator />
                  <label className="flex items-start gap-2 cursor-pointer" data-testid="terms-checkbox">
                    <Checkbox
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-muted-foreground">I agree to share my property locations and details with this cleaning service provider and accept the terms of service.</span>
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSubscribeDialogOpen(false)} data-testid="button-cancel-subscribe">Cancel</Button>
                  <Button
                    disabled={selectedListingIds.length === 0 || !termsAccepted || subscribeMutation.isPending}
                    onClick={() => {
                      if (selectedProvider) {
                        subscribeMutation.mutate({
                          providerId: selectedProvider.id,
                          listingIds: selectedListingIds,
                          termsAccepted: true,
                        });
                      }
                    }}
                    data-testid="button-confirm-subscribe"
                  >
                    {subscribeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Send Request"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {view === "subscription-detail" && selectedSub && (
          <div className="px-4 py-4 space-y-4">
            <div className={`p-4 rounded-md ${
              selectedSub.status === "PENDING" ? "bg-amber-50 border border-amber-300" :
              selectedSub.status === "ACCEPTED" ? "bg-green-50 border border-green-300" :
              "bg-red-50 border border-red-200"
            }`} data-testid="subscription-detail-status">
              <div className="flex items-center gap-2">
                {selectedSub.status === "PENDING" && <Clock className="h-5 w-5 text-amber-600" />}
                {selectedSub.status === "ACCEPTED" && <Check className="h-5 w-5 text-green-600" />}
                {selectedSub.status === "DECLINED" && <XCircle className="h-5 w-5 text-red-600" />}
                <p className="text-sm font-semibold">
                  {selectedSub.status === "PENDING" && "Waiting for acceptance"}
                  {selectedSub.status === "ACCEPTED" && "Provider is active"}
                  {selectedSub.status === "DECLINED" && "Request declined"}
                </p>
              </div>
              {selectedSub.status === "PENDING" && (
                <p className="text-xs text-amber-700 mt-1">Will respond within 24 hours. Your unit locations have been shared with the provider.</p>
              )}
              {selectedSub.status === "DECLINED" && (
                <p className="text-xs text-red-700 mt-1">{selectedSub.declineMessage || "Provider apologized for not being available to help you at this time."}</p>
              )}
            </div>

            <Card>
              <div className="p-4">
                <p className="text-sm font-semibold mb-2">Properties</p>
                {selectedSub.listings.map(l => (
                  <p key={l.id} className="text-sm text-muted-foreground">{l.name}</p>
                ))}
              </div>
            </Card>

            {selectedSub.status === "ACCEPTED" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setView("chat")}
                  data-testid="button-chat-provider"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            )}

            {selectedSub.status === "ACCEPTED" && (
              <div>
                <p className="text-sm font-semibold mb-3">Visit Reports</p>
                {loadingReports ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-md" />)}
                  </div>
                ) : visitReports && visitReports.length > 0 ? (
                  <div className="space-y-3">
                    {visitReports.map((report) => (
                      <Card key={report.id} data-testid={`visit-report-${report.id}`}>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{report.listingName}</p>
                              <p className="text-xs text-muted-foreground">{report.visitDate}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Image className="h-3 w-3" />
                              {report.photos?.length || 0} photos
                            </div>
                          </div>
                          {report.notes && <p className="text-xs text-muted-foreground mt-2">{report.notes}</p>}

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedReport(report); setView("visit-photos"); }}
                              data-testid={`button-view-photos-${report.id}`}
                            >
                              View Photos
                            </Button>
                            {!report.review && (
                              <Button
                                size="sm"
                                onClick={() => { setSelectedReport(report); setReviewRating(0); setReviewComment(""); setView("review-form"); }}
                                data-testid={`button-review-${report.id}`}
                              >
                                Leave Review
                              </Button>
                            )}
                          </div>

                          {report.review && (
                            <div className="mt-3 p-2 rounded bg-muted">
                              <div className="flex items-center gap-2">
                                <StarRating rating={report.review.rating} />
                                <span className="text-xs text-muted-foreground">{report.review.createdAt ? new Date(report.review.createdAt).toLocaleDateString() : ""}</span>
                              </div>
                              {report.review.comment && <p className="text-xs text-muted-foreground mt-1">{report.review.comment}</p>}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No visit reports yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {view === "visit-photos" && selectedReport && (
          <div className="px-4 py-4 space-y-4">
            <Card>
              <div className="p-4">
                <p className="text-sm font-semibold">{selectedReport.listingName}</p>
                <p className="text-xs text-muted-foreground">{selectedReport.visitDate}</p>
                {selectedReport.notes && <p className="text-sm text-muted-foreground mt-2">{selectedReport.notes}</p>}
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              {selectedReport.photos?.map((photo, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-md overflow-hidden border cursor-pointer"
                  onClick={() => { setSelectedPhotoIdx(idx); setPhotoViewerOpen(true); }}
                  data-testid={`visit-photo-${idx}`}
                >
                  <img src={photo} alt={`Visit photo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
              <DialogContent className="max-w-lg p-0">
                <div className="relative">
                  {selectedReport.photos?.[selectedPhotoIdx] && (
                    <img
                      src={selectedReport.photos[selectedPhotoIdx]}
                      alt={`Photo ${selectedPhotoIdx + 1}`}
                      className="w-full rounded-md"
                    />
                  )}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <Badge variant="secondary">{selectedPhotoIdx + 1} / {selectedReport.photos?.length || 0}</Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {view === "review-form" && selectedReport && selectedSub && (
          <div className="px-4 py-4 space-y-4">
            <Card>
              <div className="p-4">
                <p className="text-sm font-semibold">{selectedReport.listingName}</p>
                <p className="text-xs text-muted-foreground">Visit: {selectedReport.visitDate}</p>
              </div>
            </Card>
            <Card>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm font-semibold mb-3">How was the cleaning?</p>
                  <InteractiveStarRating value={reviewRating} onChange={setReviewRating} />
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Comments (optional)</p>
                  <Textarea
                    placeholder="Share your experience or flag any concerns for admin review..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="resize-none"
                    rows={4}
                    data-testid="input-review-comment"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Low ratings or detailed comments will be flagged for admin review.</p>
                </div>
                <Button
                  className="w-full"
                  disabled={reviewRating === 0 || reviewMutation.isPending}
                  onClick={() => {
                    reviewMutation.mutate({
                      visitReportId: selectedReport.id,
                      subscriptionId: selectedSub.id,
                      providerId: selectedSub.providerId,
                      rating: reviewRating,
                      comment: reviewComment || undefined,
                    });
                  }}
                  data-testid="button-submit-review"
                >
                  {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Review"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {view === "chat" && selectedSub && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {chatMessages && chatMessages.length > 0 ? (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === "HOST" ? "justify-end" : "justify-start"}`}
                    data-testid={`chat-msg-${msg.id}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-md px-3 py-2 ${
                        msg.senderType === "HOST"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === "HOST" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation.</p>
              )}
            </div>
            <div className="px-4 py-3 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && chatInput.trim() && selectedSub) {
                    sendMessageMutation.mutate({ subscriptionId: selectedSub.id, body: chatInput });
                  }
                }}
                data-testid="input-chat-message"
              />
              <Button
                size="icon"
                disabled={!chatInput.trim() || sendMessageMutation.isPending}
                onClick={() => {
                  if (chatInput.trim() && selectedSub) {
                    sendMessageMutation.mutate({ subscriptionId: selectedSub.id, body: chatInput });
                  }
                }}
                data-testid="button-send-chat"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
