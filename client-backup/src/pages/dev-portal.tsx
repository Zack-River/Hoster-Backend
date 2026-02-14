import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
 ArrowLeft,
 Key,
 TestTube2,
 Activity,
 Check,
 X,
 AlertTriangle,
 Circle,
 Loader2,
 Clock,
 ChevronDown,
 ChevronUp,
 ToggleLeft,
 ToggleRight,
 Copy,
 ExternalLink,
 RefreshCw,
 Trash2,
 Settings2,
 Eye,
 EyeOff,
} from "lucide-react";
import { ChannelIcon } from "@/components/channel-icon";

type Environment = "STAGING" | "PRODUCTION";

interface ChannelApiConfig {
 id: string;
 userId: string;
 channelKey: string;
 environment: string;
 apiKey: string | null;
 clientId: string | null;
 clientSecret: string | null;
 webhookUrl: string | null;
 baseUrl: string | null;
 status: string;
 lastTestedAt: string | null;
 lastTestResult: string | null;
 lastTestError: string | null;
 createdAt: string;
 updatedAt: string;
}

interface ApiCallLog {
 id: string;
 channelKey: string;
 environment: string;
 method: string;
 endpoint: string;
 statusCode: number | null;
 responseTimeMs: number | null;
 success: boolean;
 errorMessage: string | null;
 createdAt: string;
}

interface TestResult {
 success: boolean;
 statusCode: number;
 responseTimeMs: number;
 testResult: string;
 errorMessage: string | null;
 endpoint: string;
}

const CHANNELS = [
 { key: "AIRBNB", name: "Airbnb", color: "#FF5A5F" },
 { key: "BOOKING", name: "Booking.com", color: "#003580" },
 { key: "EXPEDIA", name: "Expedia", color: "#FBAF17" },
 { key: "TRIPADVISOR", name: "TripAdvisor", color: "#34E0A1" },
] as const;

function StatusBadge({ status }: { status: string }) {
 switch (status) {
 case "CONNECTED":
 return (
 <Badge variant="secondary" className="bg-emerald-50 text-emerald-700" data-testid="badge-status-connected">
 <Check className="h-3 w-3 mr-1" />
 Connected
 </Badge>
 );
 case "CONFIGURED":
 return (
 <Badge variant="secondary" className="bg-amber-50 text-amber-700" data-testid="badge-status-configured">
 <AlertTriangle className="h-3 w-3 mr-1" />
 Configured
 </Badge>
 );
 case "ERROR":
 return (
 <Badge variant="secondary" className="bg-red-50 text-red-700" data-testid="badge-status-error">
 <X className="h-3 w-3 mr-1" />
 Error
 </Badge>
 );
 default:
 return (
 <Badge variant="secondary" data-testid="badge-status-not-configured">
 <Circle className="h-3 w-3 mr-1" />
 Not Configured
 </Badge>
 );
 }
}

function ChannelConfigCard({
 channelKey,
 channelName,
 config,
 environment,
 onTest,
 isTesting,
}: {
 channelKey: string;
 channelName: string;
 config: ChannelApiConfig | undefined;
 environment: Environment;
 onTest: (channelKey: string) => void;
 isTesting: boolean;
}) {
 const [expanded, setExpanded] = useState(false);
 const [showSecret, setShowSecret] = useState(false);
 const [formData, setFormData] = useState({
 apiKey: config?.apiKey || "",
 clientId: config?.clientId || "",
 clientSecret: config?.clientSecret || "",
 webhookUrl: config?.webhookUrl || "",
 baseUrl: config?.baseUrl || "",
 });
 const { toast } = useToast();

 useEffect(() => {
 setFormData({
 apiKey: config?.apiKey || "",
 clientId: config?.clientId || "",
 clientSecret: config?.clientSecret || "",
 webhookUrl: config?.webhookUrl || "",
 baseUrl: config?.baseUrl || "",
 });
 }, [config?.id, config?.apiKey, config?.clientId, config?.clientSecret, config?.webhookUrl, config?.baseUrl, environment]);

 const saveMutation = useMutation({
 mutationFn: async (data: any) => {
 const res = await apiRequest("PUT", "/api/dev-portal/configs", data);
 return res.json();
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/dev-portal/configs"] });
 toast({ title: "Configuration saved" });
 },
 onError: () => {
 toast({ title: "Failed to save", variant: "destructive" });
 },
 });

 const deleteMutation = useMutation({
 mutationFn: async () => {
 if (!config?.id) return;
 await apiRequest("DELETE", `/api/dev-portal/configs/${config.id}`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/dev-portal/configs"] });
 setFormData({ apiKey: "", clientId: "", clientSecret: "", webhookUrl: "", baseUrl: "" });
 toast({ title: "Configuration cleared" });
 },
 });

 const handleSave = () => {
 saveMutation.mutate({
 channelKey,
 environment,
 ...formData,
 });
 };

 const maskValue = (val: string) => {
 if (!val) return "";
 if (val.length <= 8) return "****";
 return val.slice(0, 4) + "****" + val.slice(-4);
 };

 return (
 <Card className="overflow-visible" data-testid={`card-channel-${channelKey.toLowerCase()}`}>
 <div
 className="flex items-center justify-between gap-3 p-4 cursor-pointer"
 onClick={() => setExpanded(!expanded)}
 data-testid={`button-expand-${channelKey.toLowerCase()}`}
 >
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
 <ChannelIcon channelKey={channelKey as any} size={20} />
 </div>
 <div>
 <p className="text-sm font-semibold">{channelName}</p>
 <p className="text-xs text-muted-foreground">
 {config?.lastTestedAt
 ? `Last tested: ${new Date(config.lastTestedAt).toLocaleString()}`
 : "Never tested"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <StatusBadge status={config?.status || "NOT_CONFIGURED"} />
 {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
 </div>
 </div>

 {expanded && (
 <div className="px-4 pb-4 space-y-3 border-t pt-3">
 <div className="space-y-2">
 <label className="text-xs font-medium text-muted-foreground">API Key</label>
 <div className="flex gap-2">
 <Input
 type={showSecret ? "text" : "password"}
 placeholder="Enter API key..."
 value={formData.apiKey}
 onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
 data-testid={`input-api-key-${channelKey.toLowerCase()}`}
 />
 <Button
 size="icon"
 variant="ghost"
 onClick={() => setShowSecret(!showSecret)}
 data-testid={`button-toggle-secret-${channelKey.toLowerCase()}`}
 >
 {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-1">
 <label className="text-xs font-medium text-muted-foreground">Client ID</label>
 <Input
 placeholder="Client ID"
 value={formData.clientId}
 onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
 data-testid={`input-client-id-${channelKey.toLowerCase()}`}
 />
 </div>
 <div className="space-y-1">
 <label className="text-xs font-medium text-muted-foreground">Client Secret</label>
 <Input
 type={showSecret ? "text" : "password"}
 placeholder="Client Secret"
 value={formData.clientSecret}
 onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
 data-testid={`input-client-secret-${channelKey.toLowerCase()}`}
 />
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-medium text-muted-foreground">Webhook URL</label>
 <Input
 placeholder="https://your-domain.com/webhook/airbnb"
 value={formData.webhookUrl}
 onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
 data-testid={`input-webhook-${channelKey.toLowerCase()}`}
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-medium text-muted-foreground">Base URL (optional override)</label>
 <Input
 placeholder="https://api.airbnb.com/v2"
 value={formData.baseUrl}
 onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
 data-testid={`input-base-url-${channelKey.toLowerCase()}`}
 />
 </div>

 {config?.lastTestResult && (
 <div className={`text-xs p-2 rounded-md ${config.status === "CONNECTED" ? "bg-emerald-50 text-emerald-700" : config.status === "ERROR" ? "bg-red-50 text-red-700" : "bg-muted text-muted-foreground"}`}>
 {config.lastTestResult}
 {config.lastTestError && <span className="block mt-1 opacity-75">{config.lastTestError}</span>}
 </div>
 )}

 <div className="flex items-center justify-between gap-2 pt-1">
 <div className="flex gap-2">
 <Button
 onClick={handleSave}
 disabled={saveMutation.isPending}
 data-testid={`button-save-${channelKey.toLowerCase()}`}
 >
 {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
 Save
 </Button>
 <Button
 variant="outline"
 onClick={() => onTest(channelKey)}
 disabled={isTesting || !config}
 data-testid={`button-test-${channelKey.toLowerCase()}`}
 >
 {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <TestTube2 className="h-4 w-4 mr-1" />}
 Test Connection
 </Button>
 </div>
 {config?.id && (
 <Button
 size="icon"
 variant="ghost"
 onClick={() => deleteMutation.mutate()}
 disabled={deleteMutation.isPending}
 data-testid={`button-clear-${channelKey.toLowerCase()}`}
 >
 <Trash2 className="h-4 w-4 text-muted-foreground" />
 </Button>
 )}
 </div>
 </div>
 )}
 </Card>
 );
}

function ApiLogsSection() {
 const { data: logs, isLoading } = useQuery<ApiCallLog[]>({
 queryKey: ["/api/dev-portal/logs"],
 });

 if (isLoading) {
 return (
 <div className="space-y-2">
 {Array.from({ length: 5 }).map((_, i) => (
 <Skeleton key={i} className="h-12 w-full" />
 ))}
 </div>
 );
 }

 if (!logs?.length) {
 return (
 <div className="text-center py-8 text-muted-foreground" data-testid="text-no-logs">
 <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
 <p className="text-sm">No API calls logged yet</p>
 <p className="text-xs mt-1">Test a connection to see logs here</p>
 </div>
 );
 }

 return (
 <div className="space-y-1" data-testid="list-api-logs">
 {logs.map((log) => (
 <div
 key={log.id}
 className="flex items-center justify-between gap-3 p-3 rounded-md border text-sm"
 data-testid={`log-entry-${log.id}`}
 >
 <div className="flex items-center gap-3 min-w-0">
 <div className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 ${log.success ? "bg-emerald-100" : "bg-red-100"}`}>
 {log.success ? (
 <Check className="h-3 w-3 text-emerald-600" />
 ) : (
 <X className="h-3 w-3 text-red-600" />
 )}
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <Badge variant="secondary" className="text-xs">
 {log.method}
 </Badge>
 <span className="text-xs font-medium">{log.channelKey}</span>
 <Badge variant="secondary" className="text-xs">
 {log.environment}
 </Badge>
 </div>
 <p className="text-xs text-muted-foreground truncate mt-0.5">{log.endpoint}</p>
 </div>
 </div>
 <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
 {log.statusCode && <span>{log.statusCode}</span>}
 {log.responseTimeMs !== null && (
 <span className="flex items-center gap-1">
 <Clock className="h-3 w-3" />
 {log.responseTimeMs}ms
 </span>
 )}
 <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
 </div>
 </div>
 ))}
 </div>
 );
}

export default function DevPortalPage() {
 const { user, isLoading: authLoading } = useAuth();
 const [, setLocation] = useLocation();
 const [environment, setEnvironment] = useState<Environment>("STAGING");
 const [activeSection, setActiveSection] = useState<"configs" | "logs">("configs");
 const [testingChannel, setTestingChannel] = useState<string | null>(null);
 const { toast } = useToast();

 const { data: configs, isLoading: configsLoading } = useQuery<ChannelApiConfig[]>({
 queryKey: ["/api/dev-portal/configs", environment],
 queryFn: async () => {
 const res = await fetch(`/api/dev-portal/configs?environment=${environment}`, { credentials: "include" });
 if (!res.ok) throw new Error("Failed to fetch configs");
 return res.json();
 },
 enabled: !!user,
 });

 const testMutation = useMutation({
 mutationFn: async (channelKey: string) => {
 setTestingChannel(channelKey);
 const res = await apiRequest("POST", "/api/dev-portal/test-connection", {
 channelKey,
 environment,
 });
 return res.json() as Promise<TestResult>;
 },
 onSuccess: (data) => {
 queryClient.invalidateQueries({ queryKey: ["/api/dev-portal/configs"] });
 queryClient.invalidateQueries({ queryKey: ["/api/dev-portal/logs"] });
 toast({
 title: data.success ? "Connection successful" : "Connection failed",
 description: data.testResult,
 variant: data.success ? "default" : "destructive",
 });
 setTestingChannel(null);
 },
 onError: () => {
 toast({ title: "Test failed", variant: "destructive" });
 setTestingChannel(null);
 },
 });

 if (authLoading) {
 return (
 <div className="flex items-center justify-center min-h-screen">
 <Loader2 className="h-8 w-8 animate-spin text-primary" />
 </div>
 );
 }

 if (!user) {
 return (
 <div className="flex flex-col items-center justify-center min-h-screen gap-4">
 <p className="text-muted-foreground">Please log in to access the Dev Portal</p>
 <Button onClick={() => setLocation("/")} data-testid="button-go-login">
 Go to Login
 </Button>
 </div>
 );
 }

 const getConfigForChannel = (channelKey: string) =>
 configs?.find((c) => c.channelKey === channelKey);

 const connectedCount = configs?.filter((c) => c.status === "CONNECTED").length || 0;
 const configuredCount = configs?.filter((c) => c.status === "CONFIGURED").length || 0;
 const errorCount = configs?.filter((c) => c.status === "ERROR").length || 0;

 return (
 <div className="min-h-screen bg-background" data-testid="page-dev-portal">
 <div className="border-b bg-card sticky top-0 z-50">
 <div className="max-w-5xl mx-auto px-4 sm:px-6">
 <div className="flex items-center justify-between gap-4 h-14">
 <div className="flex items-center gap-3">
 <Button
 size="icon"
 variant="ghost"
 onClick={() => setLocation("/")}
 data-testid="button-back-home"
 >
 <ArrowLeft className="h-4 w-4" />
 </Button>
 <div className="flex items-center gap-2">
 <Settings2 className="h-5 w-5 text-primary" />
 <h1 className="text-lg font-semibold" data-testid="text-dev-portal-title">Dev Portal</h1>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center rounded-md border p-0.5" data-testid="toggle-environment">
 <button
 className={`px-3 py-1 text-xs font-medium rounded transition-colors ${environment === "STAGING" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
 onClick={() => setEnvironment("STAGING")}
 data-testid="button-env-staging"
 >
 Staging
 </button>
 <button
 className={`px-3 py-1 text-xs font-medium rounded transition-colors ${environment === "PRODUCTION" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
 onClick={() => setEnvironment("PRODUCTION")}
 data-testid="button-env-production"
 >
 Production
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
 <div className="grid grid-cols-3 gap-4 mb-6">
 <Card className="p-4" data-testid="stat-connected">
 <div className="flex items-center gap-2 mb-1">
 <div className="h-2 w-2 rounded-full bg-emerald-500" />
 <span className="text-xs font-medium text-muted-foreground">Connected</span>
 </div>
 <p className="text-2xl font-bold">{connectedCount}</p>
 </Card>
 <Card className="p-4" data-testid="stat-configured">
 <div className="flex items-center gap-2 mb-1">
 <div className="h-2 w-2 rounded-full bg-amber-500" />
 <span className="text-xs font-medium text-muted-foreground">Configured</span>
 </div>
 <p className="text-2xl font-bold">{configuredCount}</p>
 </Card>
 <Card className="p-4" data-testid="stat-errors">
 <div className="flex items-center gap-2 mb-1">
 <div className="h-2 w-2 rounded-full bg-red-500" />
 <span className="text-xs font-medium text-muted-foreground">Errors</span>
 </div>
 <p className="text-2xl font-bold">{errorCount}</p>
 </Card>
 </div>

 <div className="flex items-center gap-1 mb-4 border-b">
 <button
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSection === "configs" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
 onClick={() => setActiveSection("configs")}
 data-testid="tab-configs"
 >
 <Key className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
 API Configurations
 </button>
 <button
 className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeSection === "logs" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}
 onClick={() => setActiveSection("logs")}
 data-testid="tab-logs"
 >
 <Activity className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
 API Logs
 </button>
 </div>

 {activeSection === "configs" && (
 <div className="space-y-3" data-testid="section-configs">
 {configsLoading ? (
 Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-16 w-full" />
 ))
 ) : (
 CHANNELS.map((ch) => (
 <ChannelConfigCard
 key={ch.key}
 channelKey={ch.key}
 channelName={ch.name}
 config={getConfigForChannel(ch.key)}
 environment={environment}
 onTest={(key) => testMutation.mutate(key)}
 isTesting={testingChannel === ch.key}
 />
 ))
 )}
 </div>
 )}

 {activeSection === "logs" && (
 <div data-testid="section-logs">
 <div className="flex items-center justify-between gap-2 mb-3">
 <p className="text-sm text-muted-foreground">Recent API calls across all channels</p>
 <Button
 size="sm"
 variant="ghost"
 onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/dev-portal/logs"] })}
 data-testid="button-refresh-logs"
 >
 <RefreshCw className="h-3 w-3 mr-1" />
 Refresh
 </Button>
 </div>
 <ApiLogsSection />
 </div>
 )}
 </div>
 </div>
 );
}
