import db from "../db";
import { Channel, ChannelConnection, ChannelApiConfig, Prisma } from "@prisma/client";

export class ChannelService {
  async getChannels(): Promise<Channel[]> {
    return db.channel.findMany();
  }

  async getChannelByKey(key: string): Promise<Channel | null> {
    return db.channel.findUnique({ where: { key } });
  }

  async ensureChannels(): Promise<void> {
    const existing = await this.getChannels();
    if (existing.length >= 4) return;

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

  async getConnections(userId: string): Promise<(ChannelConnection & { channel: Channel })[]> {
    return db.channelConnection.findMany({
      where: { userId },
      include: { channel: true },
    });
  }

  async getConnection(userId: string, channelId: string): Promise<ChannelConnection | null> {
    return db.channelConnection.findUnique({
      where: {
        userId_channelId: { userId, channelId },
      },
    });
  }

  async upsertConnection(data: any): Promise<ChannelConnection> {
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

  async updateConnection(id: string, updates: Prisma.ChannelConnectionUpdateInput): Promise<void> {
    await db.channelConnection.update({
      where: { id },
      data: updates,
    });
  }

  async getApiConfigs(userId: string, environment?: "STAGING" | "PRODUCTION"): Promise<ChannelApiConfig[]> {
    const where: Prisma.ChannelApiConfigWhereInput = { userId };
    if (environment) {
      where.environment = environment;
    }
    return db.channelApiConfig.findMany({ where });
  }

  async getApiConfig(userId: string, channelKey: string, environment: "STAGING" | "PRODUCTION"): Promise<ChannelApiConfig | null> {
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

  async upsertApiConfig(data: any): Promise<ChannelApiConfig> {
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

  async deleteApiConfig(id: string): Promise<void> {
    await db.channelApiConfig.delete({ where: { id } });
  }

  async getExternalListingMap(channelId: string, externalListingId: string) {
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

  async getExternalListingMaps(listingId: string) {
    return db.externalListingMap.findMany({
      where: { listingId },
      include: { channel: true },
    });
  }

  async upsertExternalListingMap(data: Prisma.ExternalListingMapCreateInput) {
    const { listingId, channelId, externalListingId, ...rest } = data as any;
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

  async deleteChannelData(channelId: string): Promise<void> {
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
