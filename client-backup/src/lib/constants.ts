export const CHANNEL_KEYS = ["AIRBNB", "BOOKING", "EXPEDIA", "TRIPADVISOR"] as const;
export type ChannelKey = (typeof CHANNEL_KEYS)[number];

export const ALL_CHANNEL_KEYS = [
 "AIRBNB", "BOOKING", "EXPEDIA", "TRIPADVISOR",
 "GATHERN", "GOLDENHOST", "ESTRAHA", "WASALT", "MABET",
] as const;
export type AllChannelKey = (typeof ALL_CHANNEL_KEYS)[number];

export interface ChannelPermissions {
 calendarRead: boolean;
 calendarWrite: boolean;
 messagesRead: boolean;
 messagesWrite: boolean;
}

export interface ChannelInfoEntry {
 name: string;
 color: string;
 bgColor: string;
 textColor: string;
 permissions: ChannelPermissions;
 url?: string;
}

export const CHANNEL_INFO: Record<ChannelKey, ChannelInfoEntry> = {
 AIRBNB: {
 name: "Airbnb",
 color: "#FF5A5F",
 bgColor: "bg-[#FF5A5F]/10",
 textColor: "text-[#FF5A5F]",
 permissions: { calendarRead: true, calendarWrite: true, messagesRead: true, messagesWrite: true },
 },
 BOOKING: {
 name: "Booking.com",
 color: "#003580",
 bgColor: "bg-[#003580]/10",
 textColor: "text-[#003580]",
 permissions: { calendarRead: true, calendarWrite: true, messagesRead: true, messagesWrite: true },
 },
 EXPEDIA: {
 name: "Expedia",
 color: "#FBAF17",
 bgColor: "bg-[#FBAF17]/10",
 textColor: "text-[#D4940F]",
 permissions: { calendarRead: true, calendarWrite: false, messagesRead: true, messagesWrite: false },
 },
 TRIPADVISOR: {
 name: "TripAdvisor",
 color: "#34E0A1",
 bgColor: "bg-[#34E0A1]/10",
 textColor: "text-[#00AA6C]",
 permissions: { calendarRead: true, calendarWrite: true, messagesRead: true, messagesWrite: false },
 },
};

export const EXTRA_CHANNELS: Record<string, { name: string; color: string; url: string }> = {
 GATHERN: { name: "Gathern", color: "#6C3FC5", url: "https://gathern.co/" },
 GOLDENHOST: { name: "Golden Host", color: "#C8963E", url: "https://goldenhost.co/" },
 ESTRAHA: { name: "estrahacom", color: "#1A9E75", url: "https://www.estraha.com/" },
 WASALT: { name: "wasalt", color: "#2B6CB0", url: "https://wasalt.sa/" },
 MABET: { name: "mabet", color: "#D4513D", url: "https://mabet.com.sa/" },
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
 INQUIRY: "Inquiry",
 CONFIRMED: "Confirmed",
 CANCELED: "Canceled",
 CHECKED_IN: "Checked In",
 CHECKED_OUT: "Checked Out",
};
