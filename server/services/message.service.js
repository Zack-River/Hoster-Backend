import db from "../db";
import { listingService } from "./listing.service";
export class MessageService {
    async getConversations(userId) {
        const userListings = await listingService.getListings(userId);
        if (!userListings.length)
            return [];
        const listingIds = userListings.map((l) => l.id);
        const conversations = await db.conversation.findMany({
            where: { listingId: { in: listingIds } },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                channel: true,
                listing: true,
                reservation: true
            }
        });
        return conversations;
    }
    async getConversationById(id) {
        return db.conversation.findUnique({
            where: { id },
            include: {
                channel: true,
                listing: true
            }
        });
    }
    async upsertConversation(data) {
        const channelId = data.channelId;
        const listingId = data.listingId;
        const externalThreadId = data.externalThreadId;
        if (externalThreadId && channelId) {
            const existing = await db.conversation.findFirst({
                where: {
                    channelId,
                    externalThreadId
                }
            });
            if (existing) {
                const updated = await db.conversation.update({
                    where: { id: existing.id },
                    data: {
                        lastMessageAt: data.lastMessageAt,
                        unreadCount: { increment: 1 }
                    }
                });
                return updated;
            }
        }
        return db.conversation.create({
            data: {
                ...data,
                channel: { connect: { id: channelId } },
                listing: { connect: { id: listingId } }
            }
        });
    }
    async updateConversation(id, updates) {
        await db.conversation.update({
            where: { id },
            data: updates
        });
    }
    async markConversationRead(id) {
        await db.conversation.update({
            where: { id },
            data: { unreadCount: 0 }
        });
    }
    async getMessages(conversationId) {
        return db.message.findMany({
            where: { conversationId },
            orderBy: { sentAt: 'asc' }
        });
    }
    async createMessage(data) {
        const { conversationId, ...rest } = data;
        return db.message.create({
            data: {
                ...rest,
                conversation: { connect: { id: conversationId } }
            }
        });
    }
    async getTotalUnreadMessages(userId) {
        const userListings = await listingService.getListings(userId);
        if (!userListings.length)
            return 0;
        const listingIds = userListings.map((l) => l.id);
        const result = await db.conversation.aggregate({
            _sum: { unreadCount: true },
            where: { listingId: { in: listingIds } }
        });
        return result._sum.unreadCount || 0;
    }
    async getSupportMessages(userId) {
        const msgs = await db.supportMessage.findMany({
            where: { userId },
            orderBy: { sentAt: 'asc' }
        });
        // Mark as read by user
        await db.supportMessage.updateMany({
            where: { userId, readByUser: false },
            data: { readByUser: true }
        });
        return msgs;
    }
    async createSupportMessage(userId, body) {
        return db.supportMessage.create({
            data: {
                userId,
                direction: "INBOUND",
                body: body.trim(),
            }
        });
    }
}
export const messageService = new MessageService();
