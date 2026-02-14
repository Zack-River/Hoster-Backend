import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  ClipboardList,
  Home,
  Star,
  MessageSquare,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  X,
  Upload,
  Camera,
  Send,
  ArrowLeft,
  Check,
  XCircle,
  Calendar,
  User,
  Mail,
  Phone,
} from "lucide-react";

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  profileImageUrl?: string;
};

type Subscription = {
  id: string;
  hostId: string;
  providerId: string;
  status: string;
  listingIds: string[];
  declineMessage?: string;
  createdAt: string;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
  } | null;
  listings: Array<{ id: string; name: string; photos?: string[] }>;
};

type Review = {
  id: string;
  rating: number;
  comment?: string;
  hostName: string;
  createdAt: string;
};

type Message = {
  id: string;
  subscriptionId: string;
  senderId: string;
  senderType: string;
  body: string;
  sentAt: string;
};

type TabId = "requests" | "properties" | "reviews" | "chat";

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/auth-check"] });
      onAuth();
    },
    onError: (err: Error) => {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/register", {
        firstName,
        lastName,
        email,
        password,
        role: "provider",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account created", description: "Please log in with your new account." });
      setMode("login");
      setPassword("");
    },
    onError: (err: Error) => {
      toast({ title: "Sign up failed", description: err.message, variant: "destructive" });
    },
  });

  const isPending = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="provider-login-page">
      <div className="h-14 flex items-center justify-center border-b border-border/50">
        <span className="text-xl font-extrabold tracking-tight" style={{ color: "#FF385C" }} data-testid="text-provider-logo">
          Provider Portal
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight" data-testid="text-provider-auth-heading">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {mode === "login" ? "Log in to your provider dashboard" : "Register as a service provider"}
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (mode === "login") loginMutation.mutate();
              else signupMutation.mutate();
            }}
            className="space-y-4"
            data-testid="form-provider-auth"
          >
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-first" className="text-xs font-medium text-muted-foreground">First name</Label>
                  <Input id="p-first" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-provider-first-name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-last" className="text-xs font-medium text-muted-foreground">Last name</Label>
                  <Input id="p-last" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-provider-last-name" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="p-email" className="text-xs font-medium text-muted-foreground">Email address</Label>
              <Input id="p-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-provider-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-password" className="text-xs font-medium text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="p-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Min. 6 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 bg-card border-border rounded-md"
                  data-testid="input-provider-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" data-testid="button-toggle-provider-password">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              type="submit"
              disabled={isPending || !email || !password || (mode === "signup" && (!firstName || !lastName))}
              style={{ backgroundColor: "#FF385C", borderColor: "#FF385C" }}
              data-testid="button-provider-submit"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "login" ? "Log in" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => { setMode(mode === "login" ? "signup" : "login"); setPassword(""); }}
                className="font-medium"
                style={{ color: "#FF385C" }}
                data-testid="button-toggle-provider-auth-mode"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function RequestsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineMsg, setDeclineMsg] = useState("");

  const { data: subs, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/provider/subscriptions"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, status, declineMessage }: { id: string; status: string; declineMessage?: string }) => {
      await apiRequest("PATCH", `/api/provider/subscriptions/${id}/respond`, { status, declineMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/subscriptions"] });
      toast({ title: "Response sent" });
      setDeclineId(null);
      setDeclineMsg("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const pending = subs?.filter((s) => s.status === "PENDING") ?? [];
  const accepted = subs?.filter((s) => s.status === "ACCEPTED") ?? [];
  const declined = subs?.filter((s) => s.status === "DECLINED") ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-4 w-56 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="tab-requests">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" data-testid="badge-pending-count">Pending: {pending.length}</Badge>
        <Badge variant="secondary" data-testid="badge-accepted-count">Accepted: {accepted.length}</Badge>
        <Badge variant="secondary" data-testid="badge-declined-count">Declined: {declined.length}</Badge>
      </div>

      {(!subs || subs.length === 0) && (
        <div className="text-center py-12">
          <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No subscription requests yet</p>
        </div>
      )}

      {subs?.map((sub) => (
        <Card key={sub.id} className="p-4" data-testid={`card-request-${sub.id}`}>
          <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{(sub.host?.firstName?.[0] ?? "") + (sub.host?.lastName?.[0] ?? "")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm" data-testid={`text-host-name-${sub.id}`}>
                  {sub.host ? `${sub.host.firstName} ${sub.host.lastName}` : "Unknown Host"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {sub.host?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {sub.host.email}
                    </span>
                  )}
                  {sub.host?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {sub.host.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Badge
              variant={sub.status === "PENDING" ? "default" : sub.status === "ACCEPTED" ? "secondary" : "destructive"}
              data-testid={`badge-status-${sub.id}`}
            >
              {sub.status}
            </Badge>
          </div>

          {sub.listings.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Properties</p>
              <div className="flex flex-wrap gap-2">
                {sub.listings.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1">
                    {l.photos && l.photos.length > 0 && (
                      <img src={l.photos[0]} alt={l.name} className="h-8 w-8 rounded-md object-cover" />
                    )}
                    <span className="text-xs font-medium">{l.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-3">
            Received {new Date(sub.createdAt).toLocaleDateString()}
          </p>

          {sub.status === "PENDING" && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => respondMutation.mutate({ id: sub.id, status: "ACCEPTED" })}
                disabled={respondMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                data-testid={`button-accept-${sub.id}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeclineId(sub.id)}
                disabled={respondMutation.isPending}
                data-testid={`button-decline-${sub.id}`}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          )}

          {sub.status === "DECLINED" && sub.declineMessage && (
            <p className="text-xs text-muted-foreground italic mt-1">Reason: {sub.declineMessage}</p>
          )}
        </Card>
      ))}

      <Dialog open={!!declineId} onOpenChange={(o) => { if (!o) { setDeclineId(null); setDeclineMsg(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Reason (optional)</Label>
            <Textarea
              value={declineMsg}
              onChange={(e) => setDeclineMsg(e.target.value)}
              placeholder="Let the host know why..."
              data-testid="textarea-decline-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeclineId(null); setDeclineMsg(""); }} data-testid="button-cancel-decline">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (declineId) respondMutation.mutate({ id: declineId, status: "DECLINED", declineMessage: declineMsg || undefined });
              }}
              disabled={respondMutation.isPending}
              data-testid="button-confirm-decline"
            >
              {respondMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PropertiesTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportForm, setReportForm] = useState<{ subscriptionId: string; listingId: string; listingName: string } | null>(null);
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const { data: subs, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/provider/subscriptions"],
  });

  const accepted = subs?.filter((s) => s.status === "ACCEPTED") ?? [];

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("subscriptionId", reportForm!.subscriptionId);
      fd.append("listingId", reportForm!.listingId);
      fd.append("visitDate", visitDate);
      fd.append("notes", notes);
      photos.forEach((p) => fd.append("photos", p));
      const res = await fetch("/api/provider/visit-reports", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || res.statusText);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/visit-reports"] });
      toast({ title: "Visit report submitted" });
      closeForm();
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    },
  });

  const closeForm = () => {
    setReportForm(null);
    setVisitDate("");
    setNotes("");
    setPhotos([]);
    photoUrls.forEach((u) => URL.revokeObjectURL(u));
    setPhotoUrls([]);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const combined = [...photos, ...newFiles];
    setPhotos(combined);
    const newUrls = [...photoUrls, ...newFiles.map((f) => URL.createObjectURL(f))];
    setPhotoUrls(newUrls);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoUrls[idx]);
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPhotoUrls((u) => u.filter((_, i) => i !== idx));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [photos, photoUrls]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-24 w-full mb-2" />
            <Skeleton className="h-9 w-40" />
          </Card>
        ))}
      </div>
    );
  }

  if (reportForm) {
    return (
      <div className="p-4 space-y-4" data-testid="form-visit-report">
        <div className="flex items-center gap-3 mb-2">
          <Button size="icon" variant="ghost" onClick={closeForm} data-testid="button-back-from-report">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-sm">Submit Visit Report</h3>
            <p className="text-xs text-muted-foreground">{reportForm.listingName}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Visit Date</Label>
          <Input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="bg-card border-border rounded-md" data-testid="input-visit-date" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Describe the visit..." className="bg-card border-border rounded-md" data-testid="textarea-visit-notes" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Photos</Label>
            <span className={`text-xs font-medium ${photos.length >= 8 ? "text-emerald-600" : "text-muted-foreground"}`} data-testid="text-photo-count">
              {photos.length}/8 photos (minimum 8)
            </span>
          </div>

          <div
            className="border-2 border-dashed border-border rounded-md p-6 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            data-testid="dropzone-photos"
          >
            <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Tap to select or drag photos here</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              data-testid="input-photo-files"
            />
          </div>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-md overflow-hidden">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white"
                    style={{ visibility: "visible" }}
                    data-testid={`button-remove-photo-${idx}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          className="w-full"
          onClick={() => uploadMutation.mutate()}
          disabled={uploadMutation.isPending || photos.length < 8 || !visitDate}
          style={{ backgroundColor: "#FF385C", borderColor: "#FF385C" }}
          data-testid="button-submit-report"
        >
          {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Submit Report ({photos.length} photos)
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="tab-properties">
      {accepted.length === 0 && (
        <div className="text-center py-12">
          <Home className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No active properties yet</p>
          <p className="text-xs text-muted-foreground mt-1">Accept subscription requests to see properties here</p>
        </div>
      )}

      {accepted.map((sub) => (
        <Card key={sub.id} className="p-4" data-testid={`card-property-${sub.id}`}>
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback>{(sub.host?.firstName?.[0] ?? "") + (sub.host?.lastName?.[0] ?? "")}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{sub.host ? `${sub.host.firstName} ${sub.host.lastName}` : "Host"}</p>
              <p className="text-xs text-muted-foreground">{sub.host?.email}</p>
            </div>
          </div>
          <Separator className="mb-3" />
          <div className="space-y-3">
            {sub.listings.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/30 p-3">
                <div className="flex items-center gap-3">
                  {l.photos && l.photos.length > 0 ? (
                    <img src={l.photos[0]} alt={l.name} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                      <Home className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium text-sm" data-testid={`text-listing-name-${l.id}`}>{l.name}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setReportForm({ subscriptionId: sub.id, listingId: l.id, listingName: l.name })}
                  style={{ backgroundColor: "#FF385C", borderColor: "#FF385C" }}
                  data-testid={`button-report-${l.id}`}
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Visit Report
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReviewsTab() {
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/provider/reviews"],
  });

  const avgRating = reviews && reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4" data-testid="tab-reviews">
      <Card className="p-4 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-6 w-6 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
            />
          ))}
        </div>
        <p className="text-2xl font-bold" data-testid="text-avg-rating">{avgRating > 0 ? avgRating : "-"}</p>
        <p className="text-xs text-muted-foreground">{reviews?.length ?? 0} reviews</p>
      </Card>

      {(!reviews || reviews.length === 0) && (
        <div className="text-center py-8">
          <Star className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        </div>
      )}

      {reviews?.map((r) => (
        <Card key={r.id} className="p-4" data-testid={`card-review-${r.id}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{r.hostName?.[0] ?? "H"}</AvatarFallback>
              </Avatar>
              <span className="font-medium text-sm" data-testid={`text-reviewer-${r.id}`}>{r.hostName}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
          </div>
          {r.comment && <p className="text-sm mb-2" data-testid={`text-review-comment-${r.id}`}>{r.comment}</p>}
          <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
        </Card>
      ))}
    </div>
  );
}

function ChatTab() {
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  const { data: subs, isLoading } = useQuery<Subscription[]>({
    queryKey: ["/api/provider/subscriptions"],
  });

  const active = subs?.filter((s) => s.status === "ACCEPTED") ?? [];

  if (selectedSub) {
    return <ChatThread sub={selectedSub} onBack={() => setSelectedSub(null)} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3" data-testid="tab-chat">
      {active.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No active conversations</p>
          <p className="text-xs text-muted-foreground mt-1">Accept subscription requests to start chatting</p>
        </div>
      )}

      {active.map((sub) => (
        <Card
          key={sub.id}
          className="p-4 cursor-pointer hover-elevate"
          onClick={() => setSelectedSub(sub)}
          data-testid={`card-chat-${sub.id}`}
        >
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{(sub.host?.firstName?.[0] ?? "") + (sub.host?.lastName?.[0] ?? "")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {sub.host ? `${sub.host.firstName} ${sub.host.lastName}` : "Host"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {sub.listings.map((l) => l.name).join(", ") || "No listings"}
              </p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180 flex-shrink-0" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChatThread({ sub, onBack }: { sub: Subscription; onBack: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/provider/messages", sub.id],
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/provider/messages/${sub.id}`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provider/messages", sub.id] });
      setBody("");
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hostName = sub.host ? `${sub.host.firstName} ${sub.host.lastName}` : "Host";

  return (
    <div className="flex flex-col h-full" data-testid="chat-thread">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 sticky top-0 z-50 bg-background">
        <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back-chat">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{(sub.host?.firstName?.[0] ?? "") + (sub.host?.lastName?.[0] ?? "")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{hostName}</p>
          <p className="text-xs text-muted-foreground truncate">{sub.listings.map((l) => l.name).join(", ")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-48" />)}
          </div>
        )}

        {messages && messages.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages?.map((msg) => {
          const isProvider = msg.senderType === "PROVIDER";
          return (
            <div key={msg.id} className={`flex ${isProvider ? "justify-end" : "justify-start"}`} data-testid={`message-${msg.id}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                  isProvider ? "text-white rounded-br-sm" : "bg-muted rounded-bl-sm"
                }`}
                style={isProvider ? { backgroundColor: "#FF385C" } : undefined}
              >
                <p className="text-sm">{msg.body}</p>
                <p className={`text-[10px] mt-0.5 ${isProvider ? "text-white/70" : "text-muted-foreground"}`}>
                  {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEnd} />
      </div>

      <div className="px-4 py-3 border-t border-border/50 sticky bottom-0 z-50 bg-background">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) sendMutation.mutate();
          }}
        >
          <Input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-card border-border rounded-full"
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            type="submit"
            disabled={!body.trim() || sendMutation.isPending}
            style={{ backgroundColor: "#FF385C", borderColor: "#FF385C" }}
            data-testid="button-send-message"
          >
            {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ProviderDashboard({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>("requests");

  const tabs: Array<{ id: TabId; label: string; icon: typeof ClipboardList }> = [
    { id: "requests", label: "Requests", icon: ClipboardList },
    { id: "properties", label: "Properties", icon: Home },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="provider-dashboard">
      <header className="h-14 flex items-center justify-between gap-2 px-4 border-b border-border/50 sticky top-0 z-50 bg-background">
        <span className="text-lg font-extrabold tracking-tight" style={{ color: "#FF385C" }} data-testid="text-dashboard-logo">
          Provider Portal
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">{user.firstName} {user.lastName}</span>
          <Button size="icon" variant="ghost" onClick={onLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 max-w-2xl mx-auto w-full">
        {activeTab === "requests" && <RequestsTab />}
        {activeTab === "properties" && <PropertiesTab />}
        {activeTab === "reviews" && <ReviewsTab />}
        {activeTab === "chat" && <ChatTab />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/50 z-50 safe-area-bottom" data-testid="nav-bottom-tabs">
        <div className="max-w-2xl mx-auto flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2"
                data-testid={`tab-${tab.id}`}
              >
                <Icon className="h-5 w-5" style={{ color: isActive ? "#FF385C" : undefined }} />
                <span className="text-[10px] font-medium" style={{ color: isActive ? "#FF385C" : undefined }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function ProviderPortal() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: authData, isLoading, refetch } = useQuery<{ isProvider: boolean; user: AuthUser | null }>({
    queryKey: ["/api/provider/auth-check"],
    retry: false,
    staleTime: 0,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      refetch();
    },
    onError: () => {
      queryClient.clear();
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#FF385C" }} />
      </div>
    );
  }

  if (!authData?.isProvider || !authData.user) {
    return <LoginScreen onAuth={() => refetch()} />;
  }

  return <ProviderDashboard user={authData.user} onLogout={() => logoutMutation.mutate()} />;
}