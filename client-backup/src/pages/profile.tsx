import { useState, useRef, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Mail,
  Phone,
  Globe,
  LogOut,
  Camera,
  Building2,
  FileText,
  Crown,
  Check,
  Home,
  Sparkles,
} from "lucide-react";

function centerAspectCrop(mediaWidth: number, mediaHeight: number) {
  return centerCrop(
    makeAspectCrop(
      { unit: "%", width: 80 },
      1,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function getCroppedCanvas(
  image: HTMLImageElement,
  crop: Crop
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  let cropX: number, cropY: number, cropW: number, cropH: number;
  if (crop.unit === "%") {
    cropX = (crop.x / 100) * image.width;
    cropY = (crop.y / 100) * image.height;
    cropW = (crop.width / 100) * image.width;
    cropH = (crop.height / 100) * image.height;
  } else {
    cropX = crop.x;
    cropY = crop.y;
    cropW = crop.width;
    cropH = crop.height;
  }

  const pixelCropX = cropX * scaleX;
  const pixelCropY = cropY * scaleY;
  const pixelCropWidth = cropW * scaleX;
  const pixelCropHeight = cropH * scaleY;

  const outputSize = Math.min(pixelCropWidth, 512);
  canvas.width = outputSize;
  canvas.height = outputSize;

  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    pixelCropX,
    pixelCropY,
    pixelCropWidth,
    pixelCropHeight,
    0,
    0,
    outputSize,
    outputSize
  );

  return canvas;
}

export default function ProfilePage() {
  const { user, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [country, setCountry] = useState(user?.country || "");
  const [companyName, setCompanyName] = useState((user as any)?.companyName || "");
  const [crNumber, setCrNumber] = useState((user as any)?.crNumber || "");
  const [uploadingPic, setUploadingPic] = useState(false);

  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();

  const updateMutation = useMutation({
    mutationFn: async (data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      country?: string;
      companyName?: string;
      crNumber?: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/auth/user", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data);
      toast({ title: "Profile updated" });
      setLocation("/");
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      country: country.trim(),
      companyName: companyName.trim(),
      crNumber: crNumber.trim(),
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image must be under 10MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
  }, []);

  const handleCropComplete = async () => {
    if (!imgRef.current || !crop) return;
    setUploadingPic(true);
    setCropDialogOpen(false);

    try {
      const canvas = getCroppedCanvas(imgRef.current, crop);
      const base64 = canvas.toDataURL("image/jpeg", 0.85);
      const res = await apiRequest("POST", "/api/upload/avatar", { image: base64 });
      const data = await res.json();
      queryClient.setQueryData(["/api/auth/user"], (old: any) => ({
        ...old,
        profileImageUrl: data.url,
      }));
      toast({ title: "Profile picture updated" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPic(false);
      setImageSrc(null);
    }
  };

  if (!user) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-8">
      <div className="flex items-center gap-2.5 mb-6 py-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation("/")}
          data-testid="button-back-profile"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold" data-testid="text-profile-title">Edit Profile</h1>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage
              src={user.profileImageUrl || undefined}
              alt={user.firstName || "User"}
            />
            <AvatarFallback className="bg-muted text-xl font-semibold">
              {user.firstName?.[0]?.toUpperCase() || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <button
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background border-2 border-background"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPic}
            data-testid="button-change-avatar"
          >
            {uploadingPic ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            data-testid="input-avatar-file"
          />
        </div>
      </div>

      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open) { setCropDialogOpen(false); setImageSrc(null); } }}>
        <DialogContent className="max-w-sm" data-testid="dialog-crop-avatar">
          <DialogHeader>
            <DialogTitle>Crop your photo</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-2">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-[60vh]"
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{ maxHeight: "60vh", maxWidth: "100%" }}
                  data-testid="img-crop-preview"
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setCropDialogOpen(false); setImageSrc(null); }}
              data-testid="button-cancel-crop"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropComplete}
              disabled={!crop}
              data-testid="button-apply-crop"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" />
              First name
            </Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              data-testid="input-first-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="h-3 w-3" />
              Last name
            </Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              data-testid="input-last-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            Email
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            data-testid="input-email"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Phone className="h-3 w-3" />
            Phone
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            data-testid="input-phone"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Globe className="h-3 w-3" />
            Country
          </Label>
          <Input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            data-testid="input-country"
          />
        </div>
      </Card>

      <Card className="p-4 space-y-4 mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Business info (optional)
        </p>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            Company name
          </Label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Your company name"
            data-testid="input-company-name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            CR number
          </Label>
          <Input
            value={crNumber}
            onChange={(e) => setCrNumber(e.target.value)}
            placeholder="Commercial registration number"
            data-testid="input-cr-number"
          />
        </div>
      </Card>

      <Button
        className="w-full mt-6"
        onClick={handleSave}
        disabled={updateMutation.isPending}
        data-testid="button-save-profile"
      >
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save changes
      </Button>

      <SubscriptionSection />

      <div className="mt-8 pt-6 border-t">
        <Button
          variant="outline"
          className="w-full text-destructive"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <LogOut className="h-4 w-4 mr-2" />
          )}
          Log out
        </Button>
      </div>
    </div>
  );
}

const planColors: Record<string, string> = {
  light: "#94a3b8",
  growth: "#3b82f6",
  expanding: "#8b5cf6",
};

interface SubPlan {
  key: string;
  name: string;
  maxUnits: number;
  price: number;
  description: string;
}

interface SubscriptionData {
  currentPlan: string;
  currentPlanName: string;
  price: number;
  maxUnits: number;
  unitCount: number;
  plans: SubPlan[];
}

function SubscriptionSection() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
  });

  const changePlan = useMutation({
    mutationFn: async (plan: string) => {
      const res = await apiRequest("PATCH", "/api/subscription", { plan });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Plan updated" });
    },
    onError: () => {
      toast({ title: "Failed to change plan", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-md mt-4" />;
  }

  if (!data) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="h-4 w-4 text-muted-foreground" />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subscription
        </p>
      </div>

      <Card className="p-4 space-y-4" data-testid="card-subscription">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" data-testid="text-current-plan">{data.currentPlanName} Plan</p>
              <Badge variant="secondary" style={{ borderColor: planColors[data.currentPlan], color: planColors[data.currentPlan] }}>
                Current
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.price === 0 ? "Free" : `$${data.price}/month`}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium" data-testid="text-unit-usage">{data.unitCount} / {data.maxUnits}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">units used</p>
          </div>
        </div>

        {data.unitCount >= data.maxUnits && data.currentPlan !== "expanding" && (
          <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
            <Sparkles className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              You've reached your unit limit. Upgrade to add more properties.
            </p>
          </div>
        )}

        <div className="space-y-2 pt-1">
          {data.plans.map((plan) => {
            const isCurrent = plan.key === data.currentPlan;
            return (
              <div
                key={plan.key}
                className={`flex items-center justify-between gap-3 p-3 rounded-md border transition-colors ${
                  isCurrent ? "border-primary/30 bg-primary/5" : ""
                }`}
                data-testid={`plan-option-${plan.key}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{plan.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {plan.maxUnits === 1 ? "1 unit" : `1-${plan.maxUnits} units`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold">
                    {plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                  </span>
                  {isCurrent ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={changePlan.isPending}
                      onClick={() => changePlan.mutate(plan.key)}
                      data-testid={`button-select-${plan.key}`}
                    >
                      {changePlan.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Select"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
