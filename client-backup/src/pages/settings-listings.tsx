import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelIcon } from "@/components/channel-icon";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ChevronRight,
  Plus,
  Download,
  Home,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { type ChannelKey } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface MappingStatusItem {
  channelKey: string;
  channelName: string;
  mapped: boolean;
}

interface SettingsData {
  channels: any[];
  listings: Array<{
    id: string;
    name: string;
    status: string;
    avgPrice: number | null;
    currency: string;
    channels: Array<{ channelKey: ChannelKey; channelName: string }>;
    mappingStatus: MappingStatusItem[];
  }>;
  templates: any[];
  reminderSettings: any;
}

export default function SettingsListingsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [unitName, setUnitName] = useState("");

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/sync/import-listings", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      if (data?.importedCount > 0) {
        toast({ title: `${data.importedCount} unit${data.importedCount > 1 ? "s" : ""} imported from connected channels` });
      } else {
        toast({ title: "All units are already imported" });
      }
    },
    onError: () => {
      toast({ title: "Import failed", variant: "destructive" });
    },
  });

  const addUnitMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/listings", { name });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Unit added" });
      setAddDialogOpen(false);
      setUnitName("");
      if (data?.id) {
        setLocation(`/listing/${data.id}`);
      }
    },
    onError: () => {
      toast({ title: "Failed to add unit", variant: "destructive" });
    },
  });

  const handleAddUnit = () => {
    if (!unitName.trim()) return;
    addUnitMutation.mutate(unitName.trim());
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between gap-3 px-4 py-4 border-b sticky top-0 bg-background z-50 mb-4">
        <div className="flex items-center gap-2.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLocation("/settings")}
            data-testid="button-back-listings"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold" data-testid="text-listings-title">Units</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              data-testid="button-add-unit-menu"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => importMutation.mutate()}
              disabled={importMutation.isPending}
              data-testid="menu-import-from-apps"
            >
              <Download className="h-4 w-4 mr-2" />
              Import from apps
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAddDialogOpen(true)}
              data-testid="menu-add-unit"
            >
              <Home className="h-4 w-4 mr-2" />
              Add unit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-4 py-4 space-y-3">
        {importMutation.isPending && (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Importing units from connected channels...
          </div>
        )}

        {data?.listings && data.listings.length > 0 ? (
          data.listings.map((listing) => {
            const hasUnmapped = listing.mappingStatus?.some(m => !m.mapped);
            return (
              <div
                key={listing.id}
                className="flex items-center gap-3 p-3.5 rounded-md border cursor-pointer hover-elevate active-elevate-2"
                onClick={() => setLocation(`/listing/${listing.id}`)}
                data-testid={`listing-${listing.id}`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted flex-shrink-0">
                  <Home className="h-4.5 w-4.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{listing.name}</p>
                    {hasUnmapped && (
                      <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-amber-500" title="Has unmapped channels" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {listing.mappingStatus?.map((ms) => (
                      <div
                        key={ms.channelKey}
                        className={`flex h-5 w-5 items-center justify-center rounded-full ${ms.mapped ? "bg-muted" : "bg-destructive/10"}`}
                        title={ms.mapped ? ms.channelName : `${ms.channelName} - Unmapped`}
                        data-testid={`mapping-${listing.id}-${ms.channelKey.toLowerCase()}`}
                      >
                        <ChannelIcon channelKey={ms.channelKey as ChannelKey} size={10} />
                      </div>
                    ))}
                    {listing.avgPrice !== null && (
                      <span className="text-xs text-muted-foreground ml-auto" data-testid={`text-avg-price-${listing.id}`}>
                        ${listing.avgPrice}/avg
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
              <Home className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No units yet</p>
            <p className="text-xs text-muted-foreground max-w-[220px]">
              Add your rental units manually or import them from your connected channels.
            </p>
          </div>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm rounded-lg" data-testid="dialog-add-unit">
          <DialogHeader>
            <DialogTitle className="text-base">Add Unit</DialogTitle>
            <DialogDescription>
              Enter the name of your rental unit or property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g. Beach House, Studio Apt 3B"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddUnit();
              }}
              autoFocus
              data-testid="input-unit-name"
            />
            <div className="flex items-center gap-2">
              <Button
                className="flex-1"
                onClick={handleAddUnit}
                disabled={!unitName.trim() || addUnitMutation.isPending}
                data-testid="button-confirm-add-unit"
              >
                {addUnitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Plus className="h-4 w-4 mr-1.5" />
                )}
                Add Unit
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setUnitName("");
                }}
                data-testid="button-cancel-add-unit"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
