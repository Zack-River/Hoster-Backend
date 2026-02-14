const CONFIGS = {
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
export function createMockProvider(channelKey) {
    const config = CONFIGS[channelKey];
    return {
        async listListings(userId) {
            return config.listingNames.map((name, i) => ({
                externalListingId: `${config.prefix}-L${i + 1}`,
                name,
            }));
        },
        async listReservations(userId, sinceCursor) {
            const cursorNum = parseInt(sinceCursor || "0", 10) || 0;
            return {
                reservations: [],
                newCursor: String(cursorNum + 1),
            };
        },
        async listMessages(userId, sinceCursor) {
            const cursorNum = parseInt(sinceCursor || "0", 10) || 0;
            return {
                messages: [],
                newCursor: String(cursorNum + 1),
            };
        },
        async pushCalendarBlock(externalListingId, dateRange, block) {
            return true;
        },
        async sendMessage(externalThreadId, body) {
            return {
                channelMessageId: `${externalThreadId}-OUT-${Date.now()}`,
                success: true,
            };
        },
    };
}
