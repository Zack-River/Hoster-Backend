import { CHANNEL_INFO, EXTRA_CHANNELS, type ChannelKey } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ChannelIconProps {
  channelKey: ChannelKey | string;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

function AirbnbLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF5A5F">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.7 17.4c-.3.6-.8 1-1.4 1.2-.2.1-.4.1-.6.1-.3 0-.6-.1-.9-.2-1-.4-1.9-1.2-2.8-2.1-.4-.4-.7-.8-1-1.2-.3.4-.7.8-1 1.2-.9.9-1.8 1.7-2.8 2.1-.3.1-.6.2-.9.2-.2 0-.4 0-.6-.1-.6-.2-1.1-.6-1.4-1.2-.3-.6-.4-1.3-.2-2 .2-.8.6-1.6 1.1-2.5.5-.8 1.1-1.6 1.7-2.3.7-.8 1.4-1.5 2-2.1L12 6.5l2.1 2c.6.6 1.3 1.3 2 2.1.6.7 1.2 1.5 1.7 2.3.5.9.9 1.7 1.1 2.5.2.7.1 1.4-.2 2z" />
    </svg>
  );
}

function BookingLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#003580" />
      <path d="M7 5h4.5c1.4 0 2.5.4 3.2 1.1.5.5.8 1.2.8 2 0 1.2-.7 2-1.7 2.4v.1c1.3.3 2.2 1.3 2.2 2.7 0 .9-.3 1.7-.9 2.3-.8.8-2 1.2-3.6 1.2H7V5zm3.5 4.8c1.1 0 1.8-.5 1.8-1.4 0-.8-.6-1.3-1.7-1.3H9.8v2.7h.7zm.3 5.1c1.2 0 2-.6 2-1.6 0-1-.8-1.5-2-1.5H9.8v3.1h1z" fill="white" />
      <circle cx="17" cy="17" r="1.5" fill="#FBAF17" />
    </svg>
  );
}

function ExpediaLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#FBAF17" />
      <path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#1C3160" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="14" r="2.5" fill="#1C3160" />
    </svg>
  );
}

function TripAdvisorLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#34E0A1">
      <circle cx="12" cy="12" r="12" fill="#34E0A1" />
      <circle cx="8.5" cy="13" r="3" fill="white" />
      <circle cx="8.5" cy="13" r="1.5" fill="#34E0A1" />
      <circle cx="15.5" cy="13" r="3" fill="white" />
      <circle cx="15.5" cy="13" r="1.5" fill="#34E0A1" />
      <path d="M12 7l-1.5 2h3L12 7z" fill="white" />
    </svg>
  );
}

function GenericChannelLogo({ size = 16, color = "#888", letter = "?" }: { size?: number; color?: string; letter?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill={color} />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">{letter}</text>
    </svg>
  );
}

const logoMap: Record<ChannelKey, React.FC<{ size?: number }>> = {
  AIRBNB: AirbnbLogo,
  BOOKING: BookingLogo,
  EXPEDIA: ExpediaLogo,
  TRIPADVISOR: TripAdvisorLogo,
};

export function ChannelIcon({
  channelKey,
  size = 16,
  className,
  showLabel = false,
}: ChannelIconProps) {
  const Logo = logoMap[channelKey as ChannelKey];
  const info = CHANNEL_INFO[channelKey as ChannelKey];
  const extraInfo = EXTRA_CHANNELS[channelKey];

  if (Logo && info) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <Logo size={size} />
        {showLabel && (
          <span className={cn("text-sm font-medium", info.textColor)}>
            {info.name}
          </span>
        )}
      </span>
    );
  }

  if (extraInfo) {
    return (
      <span className={cn("inline-flex items-center gap-1.5", className)}>
        <GenericChannelLogo size={size} color={extraInfo.color} letter={extraInfo.name[0].toUpperCase()} />
        {showLabel && (
          <span className="text-sm font-medium">{extraInfo.name}</span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <GenericChannelLogo size={size} letter="?" />
    </span>
  );
}

export function ChannelBadge({
  channelKey,
  className,
}: {
  channelKey: ChannelKey;
  className?: string;
}) {
  const info = CHANNEL_INFO[channelKey];
  const Logo = logoMap[channelKey];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        info.bgColor,
        className
      )}
    >
      <Logo size={12} />
      <span className={info.textColor}>{info.name}</span>
    </span>
  );
}

export function ChannelLogoCircle({
  channelKey,
  size = 20,
  className,
}: {
  channelKey: ChannelKey;
  size?: number;
  className?: string;
}) {
  const Logo = logoMap[channelKey];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-background border border-border flex-shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Logo size={Math.round(size * 0.65)} />
    </span>
  );
}
