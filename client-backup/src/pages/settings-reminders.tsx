import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

interface SettingsData {
  channels: any[];
  listings: any[];
  templates: any[];
  reminderSettings: {
    autoCheckinMessage: boolean;
    cleaningReminder: boolean;
    checkoutReminder: boolean;
    paymentReminder: boolean;
    reviewReminder: boolean;
    enabled: boolean;
  } | null;
}

export default function SettingsRemindersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  const reminderMutation = useMutation({
    mutationFn: async (updates: {
      autoCheckinMessage?: boolean;
      cleaningReminder?: boolean;
      checkoutReminder?: boolean;
      paymentReminder?: boolean;
      reviewReminder?: boolean;
      enabled?: boolean;
    }) => {
      await apiRequest("PATCH", "/api/reminder-settings", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const reminders = [
    {
      key: "autoCheckinMessage",
      label: "Auto check-in message",
      description: "Send instructions the day before",
      checked: data?.reminderSettings?.autoCheckinMessage ?? false,
      testId: "switch-auto-checkin",
    },
    {
      key: "cleaningReminder",
      label: "Cleaning reminder",
      description: "Notification on check-out day",
      checked: data?.reminderSettings?.cleaningReminder ?? false,
      testId: "switch-cleaning-reminder",
    },
    {
      key: "checkoutReminder",
      label: "Check-out reminder",
      description: "Remind guest about check-out",
      checked: data?.reminderSettings?.checkoutReminder ?? false,
      testId: "switch-checkout-reminder",
    },
    {
      key: "paymentReminder",
      label: "Payment reminder",
      description: "Alert for pending payments",
      checked: data?.reminderSettings?.paymentReminder ?? false,
      testId: "switch-payment-reminder",
    },
    {
      key: "reviewReminder",
      label: "Review reminder",
      description: "Ask guests to leave a review",
      checked: data?.reminderSettings?.reviewReminder ?? false,
      testId: "switch-review-reminder",
    },
  ];

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b sticky top-0 bg-background z-50 mb-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setLocation("/settings")}
          data-testid="button-back-reminders"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold" data-testid="text-reminders-title">Reminders</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {reminders.map((r) => (
          <div key={r.key} className="flex items-center justify-between gap-3 p-3.5 rounded-md border">
            <div className="min-w-0">
              <Label className="text-sm font-medium">{r.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
            </div>
            <Switch
              checked={r.checked}
              onCheckedChange={(checked) => reminderMutation.mutate({ [r.key]: checked })}
              data-testid={r.testId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
