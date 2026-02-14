import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelIcon } from "@/components/channel-icon";
import { useLocation } from "wouter";
import {
  ChevronRight,
  Building2,
  FileText,
  Bell,
  MessageCircle,
  Wrench,
  Sparkles,
  HelpCircle,
  Globe,
  Zap,
} from "lucide-react";
import { CHANNEL_KEYS, type ChannelKey } from "@/lib/constants";

interface SettingsData {
  channels: Array<{
    channelKey: ChannelKey;
    channelId: string;
    name: string;
    status: string;
    lastSyncAt: string | null;
    lastError: string | null;
  }>;
  listings: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  templates: Array<{
    id: string;
    name: string;
    body: string;
  }>;
  reminderSettings: any;
}

interface SettingsLinkProps {
  icon: any;
  title: string;
  description: string;
  href: string;
  count?: number;
  testId: string;
  extra?: React.ReactNode;
}

function SettingsLink({ icon: Icon, title, description, href, count, testId, extra }: SettingsLinkProps) {
  const [, setLocation] = useLocation();
  return (
    <div
      className="flex items-center justify-between gap-3 p-4 rounded-md border cursor-pointer hover-elevate active-elevate-2"
      onClick={() => setLocation(href)}
      data-testid={testId}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-[17px]">{title}</p>
            {count !== undefined && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                {count}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-[13px] font-semibold">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {extra}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ["/api/settings"],
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  const connectedChannels = data?.channels.filter(c => c.status === "CONNECTED" || c.status === "ERROR") || [];

  return (
    <div className="px-4 py-4 space-y-2.5 pb-24">
      <h1 className="text-lg font-semibold mb-4" data-testid="text-settings-title">Settings</h1>

      <SettingsLink
        icon={Globe}
        title="Channels"
        description="Manage connected booking channels"
        href="/channels"
        count={connectedChannels.length}
        testId="link-channels"
        extra={
          <div className="flex -space-x-1">
            {CHANNEL_KEYS.slice(0, 4).map((key) => (
              <div
                key={key}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-muted border-2 border-background"
              >
                <ChannelIcon channelKey={key} size={9} />
              </div>
            ))}
          </div>
        }
      />

      <SettingsLink
        icon={Building2}
        title="Listings"
        description="View and manage your properties"
        href="/settings/listings"
        count={data?.listings?.length || 0}
        testId="link-listings"
      />

      <SettingsLink
        icon={FileText}
        title="Templates"
        description="Message templates for quick replies"
        href="/settings/templates"
        count={data?.templates?.length || 0}
        testId="link-templates"
      />

      <SettingsLink
        icon={Bell}
        title="Reminders"
        description="Configure notifications and alerts"
        href="/settings/reminders"
        testId="link-reminders"
      />

      <SettingsLink
        icon={Zap}
        title="Automation"
        description="Auto-replies, check-in messages, quiet hours"
        href="/settings/automation"
        testId="link-automation"
      />

      <SettingsLink
        icon={Sparkles}
        title="Cleaning Services"
        description="Find and manage cleaning providers"
        href="/settings/cleaning"
        testId="link-cleaning"
      />

      <SettingsLink
        icon={Wrench}
        title="Maintenance"
        description="Repair and maintenance contacts"
        href="/settings/maintenance"
        testId="link-maintenance"
      />

      <SettingsLink
        icon={HelpCircle}
        title="Community Questions"
        description="Browse questions from other hosts"
        href="/community-questions"
        testId="link-community-questions"
      />

      <SettingsLink
        icon={MessageCircle}
        title="Chat with Us"
        description="Get help from our support team"
        href="/support-chat"
        testId="link-chat-with-us"
      />
    </div>
  );
}
