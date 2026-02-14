import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
 Collapsible,
 CollapsibleContent,
 CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import {
 Sheet,
 SheetContent,
 SheetHeader,
 SheetTitle,
} from "@/components/ui/sheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
 ArrowLeft,
 Clock,
 ChevronDown,
 Send,
 Heart,
 Sparkles,
 AlertTriangle,
 CheckCircle2,
 XCircle,
 PauseCircle,
 Moon,
 Brush,
 Key,
 MessageCircle,
 Smile,
 FileText,
 Upload,
 Wifi,
 DoorOpen,
} from "lucide-react";
import { ChannelIcon } from "@/components/channel-icon";
import type { ChannelKey } from "@/lib/constants";

interface AutomationSettings {
 autoCheckinEnabled: boolean;
 autoCheckinTiming: "CHECKIN_MINUS_24H" | "CHECKIN_MORNING";
 autoCheckoutThanksEnabled: boolean;
 cleaningReminderEnabled: boolean;
 autoFirstReplyEnabled: boolean;
 quietHoursEnabled: boolean;
 quietHoursStart: string;
 quietHoursEnd: string;
}

interface CheckinSettings {
 welcomeEnabled: boolean;
 welcomeIncludePdf: boolean;
 accessEnabled: boolean;
 followupEnabled: boolean;
}

interface AutomationTemplate {
 id: string;
 key: string;
 name: string;
 body: string;
}

interface ListingConfig {
 listingId: string;
 listingName: string;
 defaultCheckinTime: string;
 hasDoorCode: boolean;
 hasWifiSsid: boolean;
 hasWifiPassword: boolean;
 brochurePdfUrl: string | null;
 brochurePdfFilename: string | null;
}

interface ListingConfigDetail {
 listingId: string;
 listingName: string;
 defaultCheckinTime: string;
 doorCode: string;
 wifiSsid: string;
 wifiPassword: string;
 brochurePdfUrl: string | null;
 brochurePdfFilename: string | null;
}

interface CheckinWarning {
 listingId: string;
 listingName: string;
 field: string;
 message: string;
}

interface AutomationLog {
 id: string;
 actionType: string;
 status: string;
 reason: string | null;
 guestName: string | null;
 listingName: string | null;
 channelKey: string | null;
 createdAt: string;
}

interface CheckinData {
 settings: CheckinSettings;
 templates: AutomationTemplate[];
 listingConfigs: ListingConfig[];
 warnings: CheckinWarning[];
}

interface LegacyData {
 settings: AutomationSettings;
 templates: AutomationTemplate[];
 pausedChannels: Array<{ channelKey: string; reason: string }>;
 unmappedListingCount: number;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
 SEND_CHECKIN_MESSAGE: "Check-in message",
 SEND_CHECKOUT_THANKYOU: "Thank-you message",
 SEND_FIRST_REPLY_ACK: "Auto-reply",
 CLEANING_REMINDER: "Cleaning reminder",
 SEND_WELCOME_10MIN: "Welcome message",
 SEND_ACCESS_30MIN: "Access details",
 SEND_FOLLOWUP_1H: "Follow-up message",
};

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
 SUCCESS: { icon: CheckCircle2, label: "Sent", className: "text-green-600" },
 FAILED: { icon: XCircle, label: "Failed", className: "text-red-600" },
 PAUSED: { icon: PauseCircle, label: "Paused", className: "text-amber-600" },
};

const TIMING_LABELS: Record<string, string> = {
 CHECKIN_MINUS_24H: "24h before",
 CHECKIN_MORNING: "Morning of",
};

const CHECKIN_TEMPLATE_VARIABLES = [
 "{{GuestName}}", "{{ListingName}}", "{{CheckInDate}}", "{{CheckOutDate}}",
 "{{CheckInTime}}", "{{DoorCode}}", "{{WifiName}}", "{{WifiPassword}}", "{{BrochureLink}}",
];

const LEGACY_TEMPLATE_VARIABLES = [
 "{{GuestName}}", "{{ListingName}}", "{{CheckInDate}}", "{{CheckOutDate}}",
];

interface AutomationCardProps {
 icon: typeof Send;
 title: string;
 description: string;
 enabled: boolean;
 onToggle: (v: boolean) => void;
 statusText: string;
 testIdPrefix: string;
 children?: React.ReactNode;
 defaultOpen?: boolean;
}

function AutomationCard({
 icon: Icon,
 title,
 description,
 enabled,
 onToggle,
 statusText,
 testIdPrefix,
 children,
 defaultOpen,
}: AutomationCardProps) {
 const [open, setOpen] = useState(defaultOpen ?? false);

 return (
 <Collapsible open={open} onOpenChange={setOpen}>
 <Card className="overflow-visible" data-testid={`card-${testIdPrefix}`}>
 <CollapsibleTrigger asChild>
 <div
 className="flex items-center gap-3 p-4 cursor-pointer select-none"
 data-testid={`trigger-${testIdPrefix}`}
 >
 <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
 <Icon className="h-4.5 w-4.5 text-muted-foreground" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium">{title}</p>
 <p className="text-xs text-muted-foreground mt-0.5 truncate">{statusText}</p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <Badge variant={enabled ? "default" : "secondary"}>
 {enabled ? "On" : "Off"}
 </Badge>
 <ChevronDown
 className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
 />
 </div>
 </div>
 </CollapsibleTrigger>

 <CollapsibleContent>
 <div className="px-4 pb-4 space-y-3 border-t pt-3">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="min-w-0">
 <Label className="text-xs font-medium">{enabled ? "Enabled" : "Disabled"}</Label>
 <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
 </div>
 <Switch
 checked={enabled}
 onCheckedChange={onToggle}
 data-testid={`switch-${testIdPrefix}`}
 />
 </div>
 {enabled && children}
 </div>
 </CollapsibleContent>
 </Card>
 </Collapsible>
 );
}

interface CheckinStepProps {
 icon: typeof Send;
 title: string;
 timing: string;
 enabled: boolean;
 onToggle: (v: boolean) => void;
 testIdPrefix: string;
 children?: React.ReactNode;
}

function CheckinStep({
 icon: Icon,
 title,
 timing,
 enabled,
 onToggle,
 testIdPrefix,
 children,
}: CheckinStepProps) {
 const [open, setOpen] = useState(false);

 return (
 <Collapsible open={open} onOpenChange={setOpen}>
 <div className="rounded-md border overflow-visible" data-testid={`step-${testIdPrefix}`}>
 <CollapsibleTrigger asChild>
 <div
 className="flex items-center gap-2.5 p-3 cursor-pointer select-none"
 data-testid={`trigger-step-${testIdPrefix}`}
 >
 <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="text-xs font-medium">{title}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{timing}</p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <Switch
 checked={enabled}
 onCheckedChange={(v) => onToggle(v)}
 onClick={(e) => e.stopPropagation()}
 data-testid={`switch-${testIdPrefix}`}
 />
 <ChevronDown
 className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
 />
 </div>
 </div>
 </CollapsibleTrigger>

 <CollapsibleContent>
 {enabled && (
 <div className="px-3 pb-3 space-y-3 border-t pt-3">
 {children}
 </div>
 )}
 </CollapsibleContent>
 </div>
 </Collapsible>
 );
}

export default function SettingsAutomationPage() {
 const { toast } = useToast();
 const [, setLocation] = useLocation();
 const [editingTemplate, setEditingTemplate] = useState<AutomationTemplate | null>(null);
 const [templateBody, setTemplateBody] = useState("");
 const [templateName, setTemplateName] = useState("");
 const [isCheckinTemplate, setIsCheckinTemplate] = useState(false);
 const [logsOpen, setLogsOpen] = useState(false);
 const [editingListing, setEditingListing] = useState<string | null>(null);
 const [applyAllMode, setApplyAllMode] = useState(false);
 const [listingForm, setListingForm] = useState({ defaultCheckinTime: "", doorCode: "", wifiSsid: "", wifiPassword: "" });

 const { data: checkinData, isLoading: checkinLoading } = useQuery<CheckinData>({
 queryKey: ["/api/automation/checkin"],
 });

 const { data: legacyData, isLoading: legacyLoading } = useQuery<LegacyData>({
 queryKey: ["/api/automation/settings"],
 });

 const { data: logsData } = useQuery<{ logs: AutomationLog[] }>({
 queryKey: ["/api/automation/logs"],
 });

 const { data: listingDetail } = useQuery<ListingConfigDetail>({
 queryKey: ["/api/listings", editingListing, "automation"],
 enabled: !!editingListing,
 });

 const checkinSettingsMutation = useMutation({
 mutationFn: async (updates: Partial<CheckinSettings>) => {
 await apiRequest("PUT", "/api/automation/checkin/settings", updates);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/checkin"] });
 },
 onError: () => {
 toast({ title: "Failed to update", variant: "destructive" });
 },
 });

 const legacySettingsMutation = useMutation({
 mutationFn: async (updates: Partial<AutomationSettings>) => {
 await apiRequest("PUT", "/api/automation/settings", updates);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/settings"] });
 },
 onError: () => {
 toast({ title: "Failed to update", variant: "destructive" });
 },
 });

 const checkinTemplateMutation = useMutation({
 mutationFn: async ({ key, body }: { key: string; body: string }) => {
 await apiRequest("PUT", `/api/automation/checkin/templates/${key}`, { body });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/checkin"] });
 setEditingTemplate(null);
 toast({ title: "Template saved" });
 },
 onError: () => {
 toast({ title: "Failed to save template", variant: "destructive" });
 },
 });

 const legacyTemplateMutation = useMutation({
 mutationFn: async ({ key, name, body }: { key: string; name: string; body: string }) => {
 await apiRequest("PUT", `/api/automation/templates/${key}`, { name, body });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/settings"] });
 setEditingTemplate(null);
 toast({ title: "Template saved" });
 },
 onError: () => {
 toast({ title: "Failed to save template", variant: "destructive" });
 },
 });

 const listingConfigMutation = useMutation({
 mutationFn: async ({ listingId, data }: { listingId: string; data: any }) => {
 await apiRequest("PUT", `/api/listings/${listingId}/automation`, data);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/checkin"] });
 queryClient.invalidateQueries({ queryKey: ["/api/listings", editingListing, "automation"] });
 setEditingListing(null);
 toast({ title: "Listing config saved" });
 },
 onError: () => {
 toast({ title: "Failed to save listing config", variant: "destructive" });
 },
 });

 const applyAllMutation = useMutation({
 mutationFn: async (data: any) => {
 const res = await apiRequest("PUT", "/api/listings/automation/apply-all", data);
 return res.json();
 },
 onSuccess: (result) => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/checkin"] });
 setApplyAllMode(false);
 setEditingListing(null);
 toast({ title: `Applied to ${result.updatedCount} listings` });
 },
 onError: () => {
 toast({ title: "Failed to apply to all listings", variant: "destructive" });
 },
 });

 const brochureUploadMutation = useMutation({
 mutationFn: async ({ listingId, file }: { listingId: string; file: File }) => {
 const formData = new FormData();
 formData.append("brochure", file);
 const res = await fetch(`/api/listings/${listingId}/brochure`, {
 method: "POST",
 body: formData,
 credentials: "include",
 });
 if (!res.ok) throw new Error("Upload failed");
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/automation/checkin"] });
 if (editingListing) {
 queryClient.invalidateQueries({ queryKey: ["/api/listings", editingListing, "automation"] });
 }
 toast({ title: "Brochure uploaded" });
 },
 onError: () => {
 toast({ title: "Upload failed", variant: "destructive" });
 },
 });

 const isLoading = checkinLoading || legacyLoading;

 if (isLoading) {
 return (
 <div className="px-4 py-4 space-y-3">
 <Skeleton className="h-8 w-48" />
 <Skeleton className="h-[68px] w-full rounded-lg" />
 <Skeleton className="h-[68px] w-full rounded-lg" />
 <Skeleton className="h-[68px] w-full rounded-lg" />
 </div>
 );
 }

 const cs = checkinData?.settings;
 const checkinTemplates = checkinData?.templates || [];
 const listingConfigs = checkinData?.listingConfigs || [];
 const warnings = checkinData?.warnings || [];

 const ls = legacyData?.settings;
 const legacyTemplates = legacyData?.templates || [];
 const pausedChannels = legacyData?.pausedChannels || [];
 const unmappedCount = legacyData?.unmappedListingCount || 0;
 const logs = logsData?.logs || [];

 const findCheckinTemplate = (key: string) => checkinTemplates.find(t => t.key === key);
 const findLegacyTemplate = (key: string) => legacyTemplates.find(t => t.key === key);

 const checkinAnyEnabled = (cs?.welcomeEnabled !== false) || (cs?.accessEnabled !== false) || (cs?.followupEnabled !== false);
 const enabledCount = [cs?.welcomeEnabled !== false, cs?.accessEnabled !== false, cs?.followupEnabled !== false].filter(Boolean).length;

 function openCheckinTemplateEditor(key: string) {
 const tpl = findCheckinTemplate(key);
 if (tpl) {
 setEditingTemplate(tpl);
 setTemplateName(tpl.name);
 setTemplateBody(tpl.body);
 setIsCheckinTemplate(true);
 }
 }

 function openLegacyTemplateEditor(key: string) {
 const tpl = findLegacyTemplate(key);
 if (tpl) {
 setEditingTemplate(tpl);
 setTemplateName(tpl.name);
 setTemplateBody(tpl.body);
 setIsCheckinTemplate(false);
 }
 }

 function openListingEditor(listingId: string) {
 setEditingListing(listingId);
 const cfg = listingConfigs.find(c => c.listingId === listingId);
 setListingForm({
 defaultCheckinTime: cfg?.defaultCheckinTime || "",
 doorCode: "",
 wifiSsid: "",
 wifiPassword: "",
 });
 }

 function handleBrochureUpload(listingId: string, file: File) {
 brochureUploadMutation.mutate({ listingId, file });
 }

 function formatTime(iso: string) {
 const d = new Date(iso);
 const now = new Date();
 const diff = now.getTime() - d.getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return "Just now";
 if (mins < 60) return `${mins}m ago`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs}h ago`;
 const days = Math.floor(hrs / 24);
 return `${days}d ago`;
 }

 const listingWarnings = (listingId: string) => warnings.filter(w => w.listingId === listingId);

 return (
 <div className="pb-24">
 <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-[999]">
 <Button
 variant="ghost"
 size="sm"
 className="gap-1.5"
 onClick={() => setLocation("/settings")}
 data-testid="button-back-automation"
 >
 <ArrowLeft className="h-4 w-4" />
 <span>Go back</span>
 </Button>
 <h1 className="text-lg font-semibold" data-testid="text-automation-title">Automation</h1>
 </div>

 <div className="px-4 py-3 space-y-3">
 {(pausedChannels.length > 0 || unmappedCount > 0) && (
 <div className="space-y-2 mb-1" data-testid="section-pause-banners">
 {pausedChannels.map((pc, i) => (
 <div key={i} className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
 <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
 <div className="flex items-center gap-1.5 min-w-0">
 <ChannelIcon channelKey={pc.channelKey as ChannelKey} size={12} />
 <p className="text-xs text-amber-700" data-testid={`text-paused-${pc.channelKey}`}>
 {pc.reason}
 </p>
 </div>
 </div>
 ))}
 {unmappedCount > 0 && (
 <div className="flex items-center gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
 <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
 <p className="text-xs text-amber-700" data-testid="text-unmapped-warning">
 {unmappedCount} listing-channel mapping{unmappedCount > 1 ? "s" : ""} missing
 </p>
 </div>
 )}
 </div>
 )}

 {/* Check-in Message — single card with all 3 steps inside */}
 <Collapsible>
 <Card className="overflow-visible" data-testid="card-checkin-message">
 <CollapsibleTrigger asChild>
 <div
 className="flex items-center gap-3 p-4 cursor-pointer select-none"
 data-testid="trigger-checkin-message"
 >
 <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted flex-shrink-0">
 <Send className="h-4.5 w-4.5 text-muted-foreground" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium">Check-in Messages</p>
 <p className="text-xs text-muted-foreground mt-0.5 truncate">
 {enabledCount}/3 steps active
 </p>
 </div>
 <div className="flex items-center gap-2 flex-shrink-0">
 <Badge variant={checkinAnyEnabled ? "default" : "secondary"}>
 {checkinAnyEnabled ? "On" : "Off"}
 </Badge>
 <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
 </div>
 </div>
 </CollapsibleTrigger>

 <CollapsibleContent>
 <div className="px-4 pb-4 space-y-3 border-t pt-3">
 {warnings.length > 0 && (
 <div className="space-y-1.5" data-testid="section-checkin-warnings">
 {Array.from(new Set(warnings.map(w => w.listingId))).map(lid => {
 const lw = listingWarnings(lid);
 const name = lw[0]?.listingName || "";
 return (
 <div key={lid} className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 border border-amber-200">
 <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
 <div className="min-w-0">
 <p className="text-xs font-medium text-amber-700">{name}</p>
 <p className="text-xs text-amber-600 mt-0.5">
 {lw.map(w => w.message).join(" · ")}
 </p>
 <Button
 variant="ghost"
 size="sm"
 className="mt-1 gap-1"
 onClick={() => openListingEditor(lid)}
 data-testid={`button-fix-listing-${lid}`}
 >
 <Key className="h-3 w-3" />
 <span className="text-xs">Configure</span>
 </Button>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Step 1: Welcome */}
 <CheckinStep
 icon={MessageCircle}
 title="Welcome Message"
 timing="Sent 10 minutes after booking"
 enabled={cs?.welcomeEnabled !== false}
 onToggle={(v) => checkinSettingsMutation.mutate({ welcomeEnabled: v })}
 testIdPrefix="welcome"
 >
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="min-w-0">
 <Label className="text-xs font-medium">Attach brochure PDF</Label>
 <p className="text-xs text-muted-foreground mt-0.5">Include a PDF house guide link</p>
 </div>
 <Switch
 checked={cs?.welcomeIncludePdf ?? false}
 onCheckedChange={(v) => checkinSettingsMutation.mutate({ welcomeIncludePdf: v })}
 data-testid="switch-welcome-pdf"
 />
 </div>

 {cs?.welcomeIncludePdf && (
 <div className="p-2.5 rounded-md bg-muted/50 border space-y-1.5">
 <p className="text-xs text-muted-foreground">PDF per listing (upload via listing config)</p>
 {listingConfigs.map(cfg => (
 <div key={cfg.listingId} className="flex items-center justify-between gap-2 flex-wrap">
 <span className="text-xs">{cfg.listingName}</span>
 {cfg.brochurePdfFilename ? (
 <Badge variant="secondary" data-testid={`badge-pdf-${cfg.listingId}`}>
 <FileText className="h-3 w-3 mr-1" /> {cfg.brochurePdfFilename}
 </Badge>
 ) : (
 <Badge variant="outline" data-testid={`badge-no-pdf-${cfg.listingId}`}>
 No PDF
 </Badge>
 )}
 </div>
 ))}
 </div>
 )}

 <div>
 <Label className="text-xs text-muted-foreground mb-1.5 block">Message template</Label>
 {findCheckinTemplate("WELCOME_10MIN") && (
 <div className="p-2.5 rounded-md bg-muted/50 border text-xs text-muted-foreground leading-relaxed mb-2">
 {findCheckinTemplate("WELCOME_10MIN")!.body.substring(0, 120)}
 {findCheckinTemplate("WELCOME_10MIN")!.body.length > 120 && "..."}
 </div>
 )}
 <Button
 variant="outline"
 size="sm"
 className="w-full"
 onClick={() => openCheckinTemplateEditor("WELCOME_10MIN")}
 data-testid="button-edit-welcome-template"
 >
 Edit message
 </Button>
 </div>
 </CheckinStep>

 {/* Step 2: Access */}
 <CheckinStep
 icon={Key}
 title="Access Details"
 timing="Sent 30 minutes before check-in"
 enabled={cs?.accessEnabled !== false}
 onToggle={(v) => checkinSettingsMutation.mutate({ accessEnabled: v })}
 testIdPrefix="access"
 >
 <div>
 <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
 <Label className="text-xs text-muted-foreground">Per-listing secure fields</Label>
 {listingConfigs.length > 1 && (
 <Button
 variant="outline"
 size="sm"
 className="gap-1.5"
 onClick={() => {
 setApplyAllMode(true);
 setEditingListing("apply-all");
 setListingForm({ defaultCheckinTime: "", doorCode: "", wifiSsid: "", wifiPassword: "" });
 }}
 data-testid="button-apply-all"
 >
 Apply to all
 </Button>
 )}
 </div>
 <div className="space-y-1.5">
 {listingConfigs.map(cfg => {
 const lw = listingWarnings(cfg.listingId).filter(w =>
 ["doorCode", "wifiSsid", "wifiPassword", "defaultCheckinTime"].includes(w.field)
 );
 const isComplete = lw.length === 0 && cfg.defaultCheckinTime;
 return (
 <div key={cfg.listingId} className="flex items-center justify-between gap-2 p-2.5 rounded-md border flex-wrap">
 <div className="flex items-center gap-2 min-w-0">
 {isComplete ? (
 <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
 ) : (
 <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
 )}
 <div className="min-w-0">
 <p className="text-xs font-medium truncate">{cfg.listingName}</p>
 {!isComplete && (
 <p className="text-xs text-amber-600 mt-0.5">
 {lw.map(w => w.message).join(", ") || "Missing check-in time"}
 </p>
 )}
 {isComplete && (
 <p className="text-xs text-muted-foreground mt-0.5">
 Check-in {cfg.defaultCheckinTime}
 {cfg.hasDoorCode && " · Door code set"}
 {cfg.hasWifiSsid && " · Wi-Fi set"}
 </p>
 )}
 </div>
 </div>
 <Button
 variant="outline"
 size="sm"
 onClick={() => openListingEditor(cfg.listingId)}
 data-testid={`button-edit-listing-${cfg.listingId}`}
 >
 Configure
 </Button>
 </div>
 );
 })}
 </div>
 </div>

 <div>
 <Label className="text-xs text-muted-foreground mb-1.5 block">Message template</Label>
 {findCheckinTemplate("ACCESS_30MIN") && (
 <div className="p-2.5 rounded-md bg-muted/50 border text-xs text-muted-foreground leading-relaxed mb-2">
 {findCheckinTemplate("ACCESS_30MIN")!.body.substring(0, 120)}
 {findCheckinTemplate("ACCESS_30MIN")!.body.length > 120 && "..."}
 </div>
 )}
 <Button
 variant="outline"
 size="sm"
 className="w-full"
 onClick={() => openCheckinTemplateEditor("ACCESS_30MIN")}
 data-testid="button-edit-access-template"
 >
 Edit message
 </Button>
 </div>
 </CheckinStep>

 {/* Step 3: Follow-up */}
 <CheckinStep
 icon={Smile}
 title="Follow-up Message"
 timing="Sent 1 hour after check-in"
 enabled={cs?.followupEnabled !== false}
 onToggle={(v) => checkinSettingsMutation.mutate({ followupEnabled: v })}
 testIdPrefix="followup"
 >
 <div>
 <Label className="text-xs text-muted-foreground mb-1.5 block">Message template</Label>
 {findCheckinTemplate("FOLLOWUP_1H") && (
 <div className="p-2.5 rounded-md bg-muted/50 border text-xs text-muted-foreground leading-relaxed mb-2">
 {findCheckinTemplate("FOLLOWUP_1H")!.body.substring(0, 120)}
 {findCheckinTemplate("FOLLOWUP_1H")!.body.length > 120 && "..."}
 </div>
 )}
 <Button
 variant="outline"
 size="sm"
 className="w-full"
 onClick={() => openCheckinTemplateEditor("FOLLOWUP_1H")}
 data-testid="button-edit-followup-template"
 >
 Edit message
 </Button>
 </div>
 </CheckinStep>
 </div>
 </CollapsibleContent>
 </Card>
 </Collapsible>

 <AutomationCard
 icon={Heart}
 title="Checkout Thank-you"
 description="Send a thank-you message the morning after check-out"
 enabled={ls?.autoCheckoutThanksEnabled ?? true}
 onToggle={(v) => legacySettingsMutation.mutate({ autoCheckoutThanksEnabled: v })}
 statusText={ls?.autoCheckoutThanksEnabled !== false ? "Sends morning after check-out" : "Disabled"}
 testIdPrefix="auto-checkout"
 >
 <div>
 <Label className="text-xs text-muted-foreground mb-1.5 block">Message template</Label>
 {findLegacyTemplate("CHECKOUT_THANKYOU") && (
 <div className="p-3 rounded-md bg-muted/50 border text-xs text-muted-foreground leading-relaxed mb-2">
 {findLegacyTemplate("CHECKOUT_THANKYOU")!.body.substring(0, 150)}
 {findLegacyTemplate("CHECKOUT_THANKYOU")!.body.length > 150 && "..."}
 </div>
 )}
 <Button variant="outline" size="sm" className="w-full" onClick={() => openLegacyTemplateEditor("CHECKOUT_THANKYOU")} data-testid="button-edit-checkout-template">
 Edit message template
 </Button>
 </div>
 </AutomationCard>

 <AutomationCard
 icon={Sparkles}
 title="Auto First Reply"
 description="Instantly acknowledge the first message from a new guest"
 enabled={ls?.autoFirstReplyEnabled ?? false}
 onToggle={(v) => legacySettingsMutation.mutate({ autoFirstReplyEnabled: v })}
 statusText={ls?.autoFirstReplyEnabled ? "Acknowledges first guest message" : "Disabled"}
 testIdPrefix="auto-reply"
 >
 <div>
 <Label className="text-xs text-muted-foreground mb-1.5 block">Reply template</Label>
 {findLegacyTemplate("FIRST_REPLY_ACK") && (
 <div className="p-3 rounded-md bg-muted/50 border text-xs text-muted-foreground leading-relaxed mb-2">
 {findLegacyTemplate("FIRST_REPLY_ACK")!.body.substring(0, 150)}
 {findLegacyTemplate("FIRST_REPLY_ACK")!.body.length > 150 && "..."}
 </div>
 )}
 <Button variant="outline" size="sm" className="w-full" onClick={() => openLegacyTemplateEditor("FIRST_REPLY_ACK")} data-testid="button-edit-reply-template">
 Edit reply template
 </Button>
 </div>
 </AutomationCard>

 <AutomationCard
 icon={Brush}
 title="Cleaning Reminder"
 description="Get notified when a property needs cleaning after checkout"
 enabled={ls?.cleaningReminderEnabled ?? false}
 onToggle={(v) => legacySettingsMutation.mutate({ cleaningReminderEnabled: v })}
 statusText={ls?.cleaningReminderEnabled ? "Notifies you on check-out day" : "Disabled"}
 testIdPrefix="cleaning-reminder"
 >
 <div className="p-3 rounded-md bg-muted/50 border">
 <p className="text-xs text-muted-foreground leading-relaxed">
 You will receive an in-app notification on the day of each guest checkout reminding you to arrange cleaning for the property.
 </p>
 </div>
 </AutomationCard>

 <AutomationCard
 icon={Moon}
 title="Quiet Hours"
 description="Pause all automated messages during a time window"
 enabled={ls?.quietHoursEnabled ?? false}
 onToggle={(v) => legacySettingsMutation.mutate({ quietHoursEnabled: v })}
 statusText={ls?.quietHoursEnabled ? `${ls?.quietHoursStart || "23:00"} \u2013 ${ls?.quietHoursEnd || "08:00"}` : "Disabled"}
 testIdPrefix="quiet-hours"
 >
 <div>
 <Label className="text-xs text-muted-foreground mb-1.5 block">No messages between</Label>
 <div className="flex items-center gap-3">
 <div className="flex-1">
 <Label className="text-xs text-muted-foreground mb-1 block">From</Label>
 <Input
 type="time"
 value={ls?.quietHoursStart || "23:00"}
 onChange={(e) => legacySettingsMutation.mutate({ quietHoursStart: e.target.value })}
 data-testid="input-quiet-start"
 />
 </div>
 <span className="text-muted-foreground mt-4">&ndash;</span>
 <div className="flex-1">
 <Label className="text-xs text-muted-foreground mb-1 block">Until</Label>
 <Input
 type="time"
 value={ls?.quietHoursEnd || "08:00"}
 onChange={(e) => legacySettingsMutation.mutate({ quietHoursEnd: e.target.value })}
 data-testid="input-quiet-end"
 />
 </div>
 </div>
 </div>
 </AutomationCard>

 {/* Activity Log */}
 <Collapsible open={logsOpen} onOpenChange={setLogsOpen}>
 <CollapsibleTrigger asChild>
 <div
 className="flex items-center justify-between gap-3 py-3 cursor-pointer select-none flex-wrap"
 data-testid="trigger-activity-log"
 >
 <div className="flex items-center gap-2">
 <Clock className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm font-medium">Activity Log</span>
 {logs.length > 0 && (
 <Badge variant="secondary">
 {logs.length}
 </Badge>
 )}
 </div>
 <ChevronDown
 className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${logsOpen ? "rotate-180" : ""}`}
 />
 </div>
 </CollapsibleTrigger>

 <CollapsibleContent>
 <div className="space-y-1.5 pb-2" data-testid="section-automation-logs">
 {logs.length === 0 ? (
 <div className="p-4 rounded-md bg-muted/50 border text-center">
 <p className="text-xs text-muted-foreground">
 No automated actions yet. Activity will appear here once automations run.
 </p>
 </div>
 ) : (
 logs.slice(0, 20).map((log) => {
 const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.FAILED;
 const StatusIcon = cfg.icon;
 return (
 <div
 key={log.id}
 className="flex items-start gap-2.5 p-3 rounded-md border"
 data-testid={`log-entry-${log.id}`}
 >
 <StatusIcon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.className}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 flex-wrap">
 <p className="text-xs font-medium">
 {ACTION_TYPE_LABELS[log.actionType] || log.actionType}
 </p>
 <span className="text-xs text-muted-foreground flex-shrink-0">
 {formatTime(log.createdAt)}
 </span>
 </div>
 <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
 {log.channelKey && (
 <ChannelIcon channelKey={log.channelKey as ChannelKey} size={11} />
 )}
 {log.guestName && (
 <span className="text-xs text-muted-foreground">{log.guestName}</span>
 )}
 {log.listingName && (
 <span className="text-xs text-muted-foreground">@ {log.listingName}</span>
 )}
 </div>
 {log.reason && (
 <p className="text-xs text-amber-600 mt-0.5">{log.reason}</p>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </CollapsibleContent>
 </Collapsible>
 </div>

 {/* Template Editor Sheet */}
 <Sheet open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
 <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
 <SheetHeader>
 <SheetTitle className="text-sm">Edit {editingTemplate?.name}</SheetTitle>
 </SheetHeader>
 <div className="space-y-3 mt-4">
 {!isCheckinTemplate && (
 <div>
 <Label className="text-xs text-muted-foreground">Template name</Label>
 <Input
 value={templateName}
 onChange={(e) => setTemplateName(e.target.value)}
 className="mt-1"
 data-testid="input-template-name"
 />
 </div>
 )}
 <div>
 <Label className="text-xs text-muted-foreground">Message body</Label>
 <Textarea
 value={templateBody}
 onChange={(e) => setTemplateBody(e.target.value)}
 className="mt-1 min-h-[120px] text-sm"
 data-testid="input-template-body"
 />
 <div className="flex gap-1.5 mt-1.5 flex-wrap">
 {(isCheckinTemplate ? CHECKIN_TEMPLATE_VARIABLES : LEGACY_TEMPLATE_VARIABLES).map(v => (
 <Badge
 key={v}
 variant="secondary"
 className="text-[11px] cursor-pointer"
 onClick={() => setTemplateBody(prev => prev + " " + v)}
 data-testid={`badge-var-${v.replace(/[{}]/g, "")}`}
 >
 {v}
 </Badge>
 ))}
 </div>
 </div>
 <Button
 className="w-full"
 onClick={() => {
 if (editingTemplate) {
 if (isCheckinTemplate) {
 checkinTemplateMutation.mutate({ key: editingTemplate.key, body: templateBody });
 } else {
 legacyTemplateMutation.mutate({ key: editingTemplate.key, name: templateName, body: templateBody });
 }
 }
 }}
 disabled={checkinTemplateMutation.isPending || legacyTemplateMutation.isPending}
 data-testid="button-save-template"
 >
 {(checkinTemplateMutation.isPending || legacyTemplateMutation.isPending) ? "Saving..." : "Save template"}
 </Button>
 </div>
 </SheetContent>
 </Sheet>

 {/* Listing Config Editor Sheet */}
 <Sheet open={!!editingListing} onOpenChange={(open) => {
 if (!open) {
 setEditingListing(null);
 setApplyAllMode(false);
 }
 }}>
 <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
 <SheetHeader>
 <SheetTitle className="text-sm">
 {applyAllMode
 ? `Apply to all ${listingConfigs.length} listings`
 : `Configure ${listingConfigs.find(c => c.listingId === editingListing)?.listingName || "Listing"}`
 }
 </SheetTitle>
 </SheetHeader>
 {applyAllMode && (
 <p className="text-xs text-muted-foreground mt-1">
 Only filled fields will be updated. Leave a field blank to keep each listing's existing value.
 </p>
 )}
 <div className="space-y-4 mt-4">
 <div>
 <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
 <Clock className="h-3 w-3" /> Default check-in time
 </Label>
 <Input
 type="time"
 value={applyAllMode ? listingForm.defaultCheckinTime : (listingDetail?.defaultCheckinTime || listingForm.defaultCheckinTime)}
 onChange={(e) => setListingForm(prev => ({ ...prev, defaultCheckinTime: e.target.value }))}
 className="mt-1"
 data-testid="input-checkin-time"
 />
 </div>
 <div>
 <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
 <DoorOpen className="h-3 w-3" /> Door code / password
 </Label>
 <Input
 type="text"
 placeholder={!applyAllMode && listingDetail?.doorCode ? "Current code set (enter new to replace)" : "Enter door code"}
 value={listingForm.doorCode}
 onChange={(e) => setListingForm(prev => ({ ...prev, doorCode: e.target.value }))}
 className="mt-1"
 data-testid="input-door-code"
 />
 {!applyAllMode && listingDetail?.doorCode && !listingForm.doorCode && (
 <p className="text-xs text-green-600 mt-1">Door code is set</p>
 )}
 </div>
 <div>
 <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
 <Wifi className="h-3 w-3" /> Wi-Fi network name (SSID)
 </Label>
 <Input
 type="text"
 placeholder={!applyAllMode && listingDetail?.wifiSsid ? "Current SSID set (enter new to replace)" : "Enter Wi-Fi name"}
 value={listingForm.wifiSsid}
 onChange={(e) => setListingForm(prev => ({ ...prev, wifiSsid: e.target.value }))}
 className="mt-1"
 data-testid="input-wifi-ssid"
 />
 {!applyAllMode && listingDetail?.wifiSsid && !listingForm.wifiSsid && (
 <p className="text-xs text-green-600 mt-1">Wi-Fi name is set</p>
 )}
 </div>
 <div>
 <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
 <Wifi className="h-3 w-3" /> Wi-Fi password
 </Label>
 <Input
 type="password"
 placeholder={!applyAllMode && listingDetail?.wifiPassword ? "Current password set (enter new to replace)" : "Enter Wi-Fi password"}
 value={listingForm.wifiPassword}
 onChange={(e) => setListingForm(prev => ({ ...prev, wifiPassword: e.target.value }))}
 className="mt-1"
 data-testid="input-wifi-password"
 />
 {!applyAllMode && listingDetail?.wifiPassword && !listingForm.wifiPassword && (
 <p className="text-xs text-green-600 mt-1">Wi-Fi password is set</p>
 )}
 </div>

 {!applyAllMode && (
 <div className="border-t pt-3">
 <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
 <FileText className="h-3 w-3" /> PDF Brochure / House Guide
 </Label>
 {(listingDetail?.brochurePdfFilename || listingConfigs.find(c => c.listingId === editingListing)?.brochurePdfFilename) && (
 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
 <Badge variant="secondary">
 <FileText className="h-3 w-3 mr-1" />
 {listingDetail?.brochurePdfFilename || listingConfigs.find(c => c.listingId === editingListing)?.brochurePdfFilename}
 </Badge>
 </div>
 )}
 <div className="mt-2">
 <input
 type="file"
 accept="application/pdf"
 id="brochure-upload"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file && editingListing) {
 handleBrochureUpload(editingListing, file);
 }
 e.target.value = "";
 }}
 data-testid="input-brochure-upload"
 />
 <Button
 variant="outline"
 size="sm"
 className="w-full gap-1.5"
 onClick={() => document.getElementById("brochure-upload")?.click()}
 disabled={brochureUploadMutation.isPending}
 data-testid="button-upload-brochure"
 >
 <Upload className="h-3.5 w-3.5" />
 {brochureUploadMutation.isPending ? "Uploading..." : "Upload / Replace PDF"}
 </Button>
 </div>
 </div>
 )}

 <Button
 className="w-full"
 onClick={() => {
 if (applyAllMode) {
 const data: any = {};
 if (listingForm.defaultCheckinTime) data.defaultCheckinTime = listingForm.defaultCheckinTime;
 if (listingForm.doorCode) data.doorCode = listingForm.doorCode;
 if (listingForm.wifiSsid) data.wifiSsid = listingForm.wifiSsid;
 if (listingForm.wifiPassword) data.wifiPassword = listingForm.wifiPassword;
 applyAllMutation.mutate(data);
 } else if (editingListing) {
 const data: any = {};
 const timeVal = listingForm.defaultCheckinTime || listingDetail?.defaultCheckinTime;
 if (timeVal) data.defaultCheckinTime = timeVal;
 if (listingForm.doorCode) data.doorCode = listingForm.doorCode;
 if (listingForm.wifiSsid) data.wifiSsid = listingForm.wifiSsid;
 if (listingForm.wifiPassword) data.wifiPassword = listingForm.wifiPassword;
 listingConfigMutation.mutate({ listingId: editingListing, data });
 }
 }}
 disabled={listingConfigMutation.isPending || applyAllMutation.isPending}
 data-testid={applyAllMode ? "button-apply-all-save" : "button-save-listing-config"}
 >
 {(listingConfigMutation.isPending || applyAllMutation.isPending)
 ? "Saving..."
 : applyAllMode
 ? `Apply to all ${listingConfigs.length} listings`
 : "Save configuration"
 }
 </Button>
 </div>
 </SheetContent>
 </Sheet>
 </div>
 );
}
