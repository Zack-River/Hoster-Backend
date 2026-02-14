import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChannelIcon } from "@/components/channel-icon";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
 ArrowLeft,
 Loader2,
 Plug,
} from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { CHANNEL_KEYS, CHANNEL_INFO, EXTRA_CHANNELS, type ChannelKey } from "@/lib/constants";

interface SettingsData {
 channels: Array<{
 channelKey: ChannelKey;
 channelId: string;
 name: string;
 status: string;
 lastSyncAt: string | null;
 lastError: string | null;
 }>;
 listings: Array<any>;
 templates: Array<any>;
 reminderSettings: any;
}

export default function ChannelsPage() {
 const { toast } = useToast();
 const [, setLocation] = useLocation();
 const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
 const [channelUsername, setChannelUsername] = useState("");
 const [channelPassword, setChannelPassword] = useState("");

 const { data, isLoading } = useQuery<SettingsData>({
 queryKey: ["/api/settings"],
 });

 const connectMutation = useMutation({
 mutationFn: async ({ channelKey, username, password }: { channelKey: ChannelKey; username?: string; password?: string }) => {
 await apiRequest("POST", "/api/providers/connect", { channelKey, username, password });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
 queryClient.invalidateQueries({ queryKey: ["/api/inbox"] });
 toast({ title: "Channel connected" });
 },
 onError: () => {
 toast({ title: "Failed to connect", variant: "destructive" });
 },
 });

 const disconnectMutation = useMutation({
 mutationFn: async (channelKey: ChannelKey) => {
 await apiRequest("POST", "/api/providers/disconnect", { channelKey });
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
 queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
 toast({ title: "Channel disconnected" });
 },
 onError: () => {
 toast({ title: "Failed to disconnect", variant: "destructive" });
 },
 });

 if (isLoading) {
 return (
 <div className="px-4 py-4 space-y-4">
 <Skeleton className="h-8 w-32" />
 <Skeleton className="h-24 w-full" />
 <Skeleton className="h-24 w-full" />
 <Skeleton className="h-24 w-full" />
 </div>
 );
 }

 const allChannelData = data?.channels || [];
 const extraChannelKeys = Object.keys(EXTRA_CHANNELS);

 return (
 <div className="px-4 py-4 pb-8">
 <div className="flex items-center gap-2.5 mb-6 py-1">
 <Button
 size="icon"
 variant="ghost"
 onClick={() => setLocation("/settings")}
 data-testid="button-back-channels"
 >
 <ArrowLeft className="h-4 w-4" />
 </Button>
 <h1 className="text-lg font-semibold" data-testid="text-channels-title">Manage Channels</h1>
 </div>

 <div className="mb-4">
 <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 Connected Channels
 </h2>
 </div>
 <div className="space-y-3">
 {CHANNEL_KEYS.map((key) => {
 const info = CHANNEL_INFO[key];
 const channelData = allChannelData.find(c => c.channelKey === key);
 const isConnected = channelData?.status === "CONNECTED";
 const isError = channelData?.status === "ERROR";

 return (
 <Card key={key} className="p-4" data-testid={`channel-card-${key.toLowerCase()}`}>
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
 <ChannelIcon channelKey={key} size={20} />
 </div>
 <div className="min-w-0">
 <p className="font-medium text-sm">{info.name}</p>
 {isConnected && channelData?.lastSyncAt && (
 <p className="text-xs text-muted-foreground mt-0.5">
 Synced {formatDistanceToNow(parseISO(channelData.lastSyncAt), { addSuffix: true })}
 </p>
 )}
 {isError && channelData?.lastError && (
 <p className="text-xs text-destructive truncate mt-0.5">
 {channelData.lastError}
 </p>
 )}
 {!isConnected && !isError && (
 <p className="text-xs text-muted-foreground mt-0.5">Not connected</p>
 )}
 </div>
 </div>
 {isConnected || isError ? (
 <div className="flex items-center gap-2 flex-shrink-0">
 <Badge
 variant="secondary"
 className={`text-xs no-default-hover-elevate no-default-active-elevate ${isError ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
 >
 {isError ? "Error" : "Active"}
 </Badge>
 <Button
 size="sm"
 variant="outline"
 onClick={() => disconnectMutation.mutate(key)}
 disabled={disconnectMutation.isPending}
 data-testid={`button-disconnect-${key.toLowerCase()}`}
 >
 {disconnectMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin" />
 ) : (
 "Disconnect"
 )}
 </Button>
 </div>
 ) : (
 <Button
 size="sm"
 onClick={() => {
 setConnectingChannel(key);
 setChannelUsername("");
 setChannelPassword("");
 }}
 data-testid={`button-connect-${key.toLowerCase()}`}
 >
 <Plug className="h-3.5 w-3.5 mr-1.5" />
 Connect
 </Button>
 )}
 </div>
 </Card>
 );
 })}
 </div>

 <div className="mt-6 mb-4">
 <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 More channels
 </h2>
 </div>
 <div className="space-y-3">
 {extraChannelKeys.map((key) => {
 const ch = EXTRA_CHANNELS[key];
 return (
 <Card key={key} className="p-4" data-testid={`channel-card-${key.toLowerCase()}`}>
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-3 min-w-0">
 <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
 <ChannelIcon channelKey={key} size={20} />
 </div>
 <div className="min-w-0">
 <p className="font-medium text-sm">{ch.name}</p>
 <p className="text-xs text-muted-foreground mt-0.5">Not connected</p>
 </div>
 </div>
 <Button
 size="sm"
 onClick={() => {
 setConnectingChannel(key as ChannelKey);
 setChannelUsername("");
 setChannelPassword("");
 }}
 data-testid={`button-connect-${key.toLowerCase()}`}
 >
 <Plug className="h-3.5 w-3.5 mr-1.5" />
 Connect
 </Button>
 </div>
 </Card>
 );
 })}
 </div>

 <AlertDialog open={connectingChannel !== null} onOpenChange={(open) => { if (!open) { setConnectingChannel(null); setChannelUsername(""); setChannelPassword(""); } }}>
 <AlertDialogContent data-testid="dialog-connect-channel">
 <AlertDialogHeader>
 <AlertDialogTitle className="flex items-center gap-2">
 {connectingChannel && <ChannelIcon channelKey={connectingChannel} size={20} />}
 Connect {connectingChannel ? ((CHANNEL_INFO as Record<string, any>)[connectingChannel]?.name || EXTRA_CHANNELS[connectingChannel]?.name || "") : ""}
 </AlertDialogTitle>
 <AlertDialogDescription>
 Enter your {connectingChannel ? ((CHANNEL_INFO as Record<string, any>)[connectingChannel]?.name || EXTRA_CHANNELS[connectingChannel]?.name || "") : ""} account credentials to connect.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <div className="space-y-3 py-2">
 <div className="space-y-1.5">
 <Label className="text-xs text-muted-foreground">Username or Email</Label>
 <Input
 value={channelUsername}
 onChange={(e) => setChannelUsername(e.target.value)}
 placeholder="your@email.com"
 data-testid="input-channel-username"
 />
 </div>
 <div className="space-y-1.5">
 <Label className="text-xs text-muted-foreground">Password</Label>
 <Input
 type="password"
 value={channelPassword}
 onChange={(e) => setChannelPassword(e.target.value)}
 placeholder="Account password"
 data-testid="input-channel-password"
 />
 </div>
 </div>
 <AlertDialogFooter>
 <AlertDialogCancel data-testid="button-cancel-connect">Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={() => {
 if (connectingChannel) {
 connectMutation.mutate({
 channelKey: connectingChannel as ChannelKey,
 username: channelUsername.trim(),
 password: channelPassword.trim(),
 });
 setConnectingChannel(null);
 setChannelUsername("");
 setChannelPassword("");
 }
 }}
 disabled={!channelUsername.trim() || !channelPassword.trim() || connectMutation.isPending}
 data-testid="button-confirm-connect"
 >
 {connectMutation.isPending ? (
 <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
 ) : null}
 Connect
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 );
}
