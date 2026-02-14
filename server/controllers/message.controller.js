import { messageService } from "../services/message.service";
import { listingService } from "../services/listing.service";
import { templateService } from "../services/template.service";
import { reservationService } from "../services/reservation.service";
import { getProvider } from "../providers";
import { z } from "zod";
export class MessageController {
    async getInbox(req, res) {
        try {
            const userId = req.session.userId;
            const convs = await messageService.getConversations(userId);
            const items = await Promise.all(convs.map(async (conv) => {
                const msgs = await messageService.getMessages(conv.id);
                const lastMsg = msgs[msgs.length - 1];
                return {
                    id: conv.id,
                    guestName: conv.guestName,
                    channelKey: conv.channel.key,
                    channelName: conv.channel.name,
                    checkIn: conv.reservation?.checkIn ?? null,
                    checkOut: conv.reservation?.checkOut ?? null,
                    lastMessage: lastMsg?.body ?? null,
                    lastMessageAt: conv.lastMessageAt?.toISOString() ?? null,
                    unreadCount: conv.unreadCount,
                    listingName: conv.listing.name,
                };
            }));
            res.json(items);
        }
        catch (error) {
            console.error("Inbox error:", error);
            res.status(500).json({ message: "Failed to load inbox" });
        }
    }
    async getChat(req, res) {
        try {
            const userId = req.session.userId;
            const conv = await messageService.getConversationById(req.params.id);
            if (!conv) {
                return res.status(404).json({ message: "Conversation not found" });
            }
            const listing = await listingService.getListingById(conv.listingId);
            if (!listing || listing.userId !== userId) {
                return res.status(403).json({ message: "Forbidden" });
            }
            await messageService.markConversationRead(conv.id);
            const [msgs, tmpls] = await Promise.all([
                messageService.getMessages(conv.id),
                templateService.getTemplates(userId),
            ]);
            let reservation = null;
            if (conv.reservationId) {
                const allRes = await reservationService.getReservations(conv.listingId);
                reservation = allRes.find((r) => r.id === conv.reservationId) ?? null;
            }
            res.json({
                conversation: {
                    id: conv.id,
                    guestName: conv.guestName,
                    channelKey: conv.channel.key,
                    channelName: conv.channel.name,
                    listingName: conv.listing.name,
                    checkIn: reservation?.checkIn ?? null,
                    checkOut: reservation?.checkOut ?? null,
                },
                messages: msgs.map((m) => ({
                    id: m.id,
                    direction: m.direction,
                    body: m.body,
                    sentAt: m.sentAt?.toISOString() ?? new Date().toISOString(),
                })),
                templates: tmpls.map((t) => ({ id: t.id, name: t.name, body: t.body })),
            });
        }
        catch (error) {
            console.error("Chat error:", error);
            res.status(500).json({ message: "Failed to load chat" });
        }
    }
    async sendMessage(req, res) {
        try {
            const userId = req.session.userId;
            const schema = z.object({ body: z.string().min(1) });
            const { body } = schema.parse(req.body);
            const conv = await messageService.getConversationById(req.params.id);
            if (!conv) {
                return res.status(404).json({ message: "Conversation not found" });
            }
            const listing = await listingService.getListingById(conv.listingId);
            if (!listing || listing.userId !== userId) {
                return res.status(403).json({ message: "Forbidden" });
            }
            let channelMessageId = null;
            try {
                const provider = getProvider(conv.channel.key);
                const result = await provider.sendMessage(conv.externalThreadId || conv.id, body);
                channelMessageId = result.channelMessageId;
            }
            catch (err) {
                console.error("Failed to send via provider:", err);
            }
            const msg = await messageService.createMessage({
                conversationId: conv.id,
                direction: "OUTBOUND",
                body,
                channelMessageId,
            });
            await messageService.updateConversation(conv.id, {
                lastMessageAt: new Date(),
            });
            res.json({
                id: msg.id,
                direction: msg.direction,
                body: msg.body,
                sentAt: msg.sentAt?.toISOString(),
                status: channelMessageId ? "sent" : "failed",
            });
        }
        catch (error) {
            console.error("Send message error:", error);
            res.status(500).json({ message: "Failed to send message" });
        }
    }
    async getSupportMessages(req, res) {
        try {
            const userId = req.session.userId;
            const msgs = await messageService.getSupportMessages(userId);
            res.json(msgs.map(m => ({
                id: m.id,
                direction: m.direction,
                body: m.body,
                sentAt: m.sentAt?.toISOString() ?? null,
            })));
        }
        catch (error) {
            console.error("Get support messages error:", error);
            res.status(500).json({ message: "Failed to load messages" });
        }
    }
    async sendSupportMessage(req, res) {
        try {
            const userId = req.session.userId;
            const { body } = req.body;
            if (!body || typeof body !== "string" || !body.trim()) {
                return res.status(400).json({ message: "Message body is required" });
            }
            const msg = await messageService.createSupportMessage(userId, body);
            res.json({
                id: msg.id,
                direction: msg.direction,
                body: msg.body,
                sentAt: msg.sentAt?.toISOString() ?? null,
            });
        }
        catch (error) {
            console.error("Send support message error:", error);
            res.status(500).json({ message: "Failed to send message" });
        }
    }
}
export const messageController = new MessageController();
