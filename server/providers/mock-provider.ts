import type {
  IProviderAdapter,
  ExternalListing,
  ExternalReservation,
  ExternalMessage,
} from "./types";

type ChannelKey = "AIRBNB" | "BOOKING" | "EXPEDIA" | "TRIPADVISOR";

interface MockProviderConfig {
  channelKey: ChannelKey;
  listingNames: string[];
  prefix: string;
}

const CONFIGS: Record<ChannelKey, MockProviderConfig> = {
  AIRBNB: {
    channelKey: "AIRBNB",
    listingNames: ["Sunny Beach Studio", "Mountain View Cabin", "Downtown Loft"],
    prefix: "ABB",
  },
  BOOKING: {
    channelKey: "BOOKING",
    listingNames: ["Sunny Beach Studio", "Riverside Apartment"],
    prefix: "BKG",
  },
  EXPEDIA: {
    channelKey: "EXPEDIA",
    listingNames: ["Mountain View Cabin", "Lake House Retreat"],
    prefix: "EXP",
  },
  TRIPADVISOR: {
    channelKey: "TRIPADVISOR",
    listingNames: ["Downtown Loft", "Sunny Beach Studio", "Garden Villa"],
    prefix: "TRA",
  },
};

export function createMockProvider(channelKey: ChannelKey): IProviderAdapter {
  const config = CONFIGS[channelKey];

  return {
    async listListings(userId: string): Promise<ExternalListing[]> {
      return config.listingNames.map((name, i) => ({
        externalListingId: `${config.prefix}-L${i + 1}`,
        name,
      }));
    },

    async listReservations(
      userId: string,
      sinceCursor: string | null
    ): Promise<{
      reservations: ExternalReservation[];
      newCursor: string;
    }> {
      const cursorNum = parseInt(sinceCursor || "0", 10) || 0;
      return {
        reservations: [],
        newCursor: String(cursorNum + 1),
      };
    },

    async listMessages(
      userId: string,
      sinceCursor: string | null
    ): Promise<{
      messages: ExternalMessage[];
      newCursor: string;
    }> {
      const cursorNum = parseInt(sinceCursor || "0", 10) || 0;
      return {
        messages: [],
        newCursor: String(cursorNum + 1),
      };
    },

    async pushCalendarBlock(
      externalListingId: string,
      dateRange: { start: string; end: string },
      block: boolean
    ): Promise<boolean> {
      return true;
    },

    async sendMessage(
      externalThreadId: string,
      body: string
    ): Promise<{ channelMessageId: string; success: boolean }> {
      return {
        channelMessageId: `${externalThreadId}-OUT-${Date.now()}`,
        success: true,
      };
    },
  };
}
