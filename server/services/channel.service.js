import db from "../db";
export class ChannelService {
    async getChannels() {
        return db.channel.findMany();
    }
    async getChannelByKey(key) {
        return db.channel.findUnique({ where: { key } });
    }
    async ensureChannels() {
        const existing = await this.getChannels();
        if (existing.length >= 4)
            return;
        const channelData = [
            { key: "AIRBNB", name: "Airbnb", logoUrl: null },
            { key: "BOOKING", name: "Booking.com", logoUrl: null },
            { key: "EXPEDIA", name: "Expedia", logoUrl: null },
            { key: "TRIPADVISOR", name: "TripAdvisor", logoUrl: null },
        ];
        for (const ch of channelData) {
            await db.channel.upsert({
                where: { key: ch.key },
                update: {},
                create: ch,
            });
        }
    }
    async getConnections(userId) {
        return db.channelConnection.findMany({
            where: { userId },
            include: { channel: true },
        });
    }
    async getConnection(userId, channelId) {
        return db.channelConnection.findUnique({
            where: {
                userId_channelId: { userId, channelId },
            },
        });
    }
    async upsertConnection(data) {
        const { userId, channelId, status, lastSyncAt, cursor, lastError, ...rest } = data;
        return db.channelConnection.upsert({
            where: {
                userId_channelId: { userId, channelId },
            },
            update: {
                status,
                lastSyncAt,
                cursor,
                lastError,
                ...rest
            },
            create: {
                user: { connect: { id: userId } },
                channel: { connect: { id: channelId } },
                status,
                lastSyncAt,
                cursor,
                lastError,
                ...rest
            },
        });
    }
    async updateConnection(id, updates) {
        await db.channelConnection.update({
            where: { id },
            data: updates,
        });
    }
    async getApiConfigs(userId, environment) {
        const where = { userId };
        if (environment) {
            where.environment = environment;
        }
        return db.channelApiConfig.findMany({ where });
    }
    async getApiConfig(userId, channelKey, environment) {
        return db.channelApiConfig.findUnique({
            where: {
                userId_channelKey_environment: {
                    userId,
                    channelKey,
                    environment,
                },
            },
        });
    }
    async upsertApiConfig(data) {
        const { userId, channelKey, environment, ...rest } = data;
        return db.channelApiConfig.upsert({
            where: {
                userId_channelKey_environment: {
                    userId,
                    channelKey,
                    environment,
                },
            },
            update: {
                ...rest,
                updatedAt: new Date(),
            },
            create: {
                user: { connect: { id: userId } },
                channelKey,
                environment,
                ...rest,
            },
        });
    }
    async deleteApiConfig(id) {
        await db.channelApiConfig.delete({ where: { id } });
    }
    async getExternalListingMap(channelId, externalListingId) {
        return db.externalListingMap.findUnique({
            where: {
                channelId_externalListingId: {
                    channelId,
                    externalListingId,
                },
            },
            include: { listing: true, channel: true },
        });
    }
    async getExternalListingMaps(listingId) {
        return db.externalListingMap.findMany({
            where: { listingId },
            include: { channel: true },
        });
    }
    async upsertExternalListingMap(data) {
        const { listingId, channelId, externalListingId, ...rest } = data;
        return db.externalListingMap.upsert({
            where: {
                channelId_externalListingId: {
                    channelId,
                    externalListingId,
                },
            },
            update: {
                listingId,
                ...rest,
                lastSyncedAt: new Date(),
            },
            create: {
                listingId,
                channelId,
                externalListingId,
                ...rest,
                lastSyncedAt: new Date(),
            },
        });
    }
    async deleteChannelData(channelId) {
        // Delete all data associated with this channel
        // Excluding Channel and ChannelApiConfig itself? No, usually disconnecting removes connection.
        // We should delete Connection, Maps, Reservations, Conversations.
        // AutomationActionLogs also reference channelId.
        await db.$transaction([
            db.externalListingMap.deleteMany({ where: { channelId } }),
            db.reservation.deleteMany({ where: { channelId } }), // This might fail if cleaning tasks reference reservation.
            // CleaningTasks reference Reservation. Cascade delete might be configured or needed.
            // Prisma schema: CleaningTask.reservationId -> Reservation.id. No onDelete cascade specified in schema.
            // We might need to delete cleaning tasks first.
            db.cleaningTask.deleteMany({ where: { reservation: { channelId } } }),
            db.reservation.deleteMany({ where: { channelId } }),
            // Messages reference Conversation.
            db.message.deleteMany({ where: { conversation: { channelId } } }),
            db.conversation.deleteMany({ where: { channelId } }),
            db.automationActionLog.deleteMany({ where: { channelId } }),
            db.channelConnection.deleteMany({ where: { channelId } }),
        ]);
    }
}
export const channelService = new ChannelService();
