import db from "../db";
import { listingService } from "./listing.service";
export class AutomationService {
    async getSettings(userId) {
        return db.automationSettings.findUnique({ where: { userId } });
    }
    async upsertSettings(data) {
        const { userId, ...rest } = data;
        return db.automationSettings.upsert({
            where: { userId },
            update: { ...rest, updatedAt: new Date() },
            create: {
                ...rest,
                user: { connect: { id: userId } }
            },
        });
    }
    async getTemplates(userId) {
        return db.automationTemplate.findMany({ where: { userId } });
    }
    async getTemplateByKey(userId, key) {
        // key comes as string, but Prisma expects enum if defined as enum in schema.
        // In our schema, AutomationTemplateKey is an enum.
        return db.automationTemplate.findUnique({
            where: {
                userId_key: {
                    userId,
                    key: key,
                },
            },
        });
    }
    async upsertTemplate(data) {
        const { userId, key, name, body } = data;
        return db.automationTemplate.upsert({
            where: {
                userId_key: {
                    userId,
                    key: key,
                },
            },
            update: {
                name,
                body,
                updatedAt: new Date(),
            },
            create: {
                user: { connect: { id: userId } },
                key: key,
                name,
                body,
            },
        });
    }
    async createTemplate(data) {
        const { userId, ...rest } = data;
        return db.automationTemplate.create({
            data: {
                ...rest,
                user: { connect: { id: userId } }
            }
        });
    }
    async updateTemplate(id, data) {
        return db.automationTemplate.update({
            where: { id },
            data: { ...data, updatedAt: new Date() }
        });
    }
    async deleteTemplate(id) {
        await db.automationTemplate.delete({ where: { id } });
    }
    async createActionLog(data) {
        const { userId, listingId, reservationId, channelId, ...rest } = data;
        return db.automationActionLog.create({
            data: {
                ...rest,
                user: userId ? { connect: { id: userId } } : undefined,
                listing: listingId ? { connect: { id: listingId } } : undefined,
                reservation: reservationId ? { connect: { id: reservationId } } : undefined,
                channel: channelId ? { connect: { id: channelId } } : undefined,
            }
        });
    }
    async getActionLogs(userId, limit = 20) {
        return db.automationActionLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
    async checkDedupeKey(dedupeKey) {
        const count = await db.automationActionLog.count({
            where: { dedupeKey },
        });
        return count > 0;
    }
    async seedTemplates(userId) {
        const existing = await this.getTemplates(userId);
        const defaults = [
            {
                userId,
                key: "CHECKIN_MESSAGE",
                name: "Check-in Message",
                body: "Hi {{GuestName}}, welcome to {{ListingName}}! Your check-in is on {{CheckInDate}}. Here are the details:\n\nAddress: [Your address]\nDoor code: [Code]\nWi-Fi: [Network/Password]\n\nLooking forward to hosting you!",
            },
            {
                userId,
                key: "CHECKOUT_THANKYOU",
                name: "Check-out Thank You",
                body: "Hi {{GuestName}}, thank you for staying at {{ListingName}}! We hope you had a wonderful time. If you enjoyed your stay, we'd really appreciate a review. We'd love to host you again!",
            },
            {
                userId,
                key: "FIRST_REPLY_ACK",
                name: "First Reply Acknowledgment",
                body: "Thanks for your message! I'll get back to you shortly.",
            },
            {
                userId,
                key: "WELCOME_10MIN",
                name: "Welcome Message",
                body: "Hi {{GuestName}}, thank you for booking {{ListingName}}! We're excited to host you from {{CheckInDate}} to {{CheckOutDate}}.\n\nHere's some general information to help you prepare:\n- Check-in time: {{CheckInTime}}\n- Location details will follow closer to your arrival\n\n{{BrochureLink}}\n\nFeel free to reach out if you have any questions!",
            },
            {
                userId,
                key: "ACCESS_30MIN",
                name: "Access Instructions",
                body: "Hi {{GuestName}}, as promised, here are your access instructions for {{ListingName}}.\n\nDoor code: [Code]\n\nLet me know if you have any trouble getting in!",
            },
            {
                userId,
                key: "CLEANING_REMINDER",
                name: "Cleaning Reminder",
                body: "Reminder: Cleaning scheduled for {{ListingName}} on {{Date}}.",
            },
            {
                userId,
                key: "FOLLOWUP_1H", // Changed from FOLLOWUP_7DAY to match Enum in Schema (FOLLOWUP_1H is in schema, 7DAY is not?)
                // Schema has FOLLOWUP_1H. Let's start with that or check valid keys.
                // Schema: CHECKIN_MESSAGE, CHECKOUT_THANKYOU, FIRST_REPLY_ACK, WELCOME_10MIN, ACCESS_30MIN, FOLLOWUP_1H
                // 7DAY is not in schema enum I wrote. I should use 1H or add 7DAY to schema. 
                // I'll use 1H for now to be safe with valid enum.
                name: "Post-Stay Follow-up",
                body: "Hi {{GuestName}}, hope you are enjoying your stay!",
            },
        ];
        for (const template of defaults) {
            if (!existing.find(t => t.key === template.key)) {
                await this.upsertTemplate(template);
            }
        }
    }
    async getListingConfig(listingId) {
        return db.listingAutomationConfig.findUnique({ where: { listingId } });
    }
    async upsertListingConfig(data) {
        const { listingId, ...rest } = data;
        return db.listingAutomationConfig.upsert({
            where: { listingId },
            update: { ...rest, updatedAt: new Date() },
            create: {
                ...rest,
                listing: { connect: { id: listingId } }
            },
        });
    }
    async getListingConfigsByUser(userId) {
        const userListings = await listingService.getListings(userId);
        if (!userListings.length)
            return [];
        const listingIds = userListings.map(l => l.id);
        const configs = await db.listingAutomationConfig.findMany({
            where: { listingId: { in: listingIds } },
            include: { listing: true }
        });
        return configs.map(c => ({
            ...c,
            listingName: c.listing.name,
        }));
    }
    async getAllUserIds() {
        const users = await db.user.findMany({ select: { id: true } });
        return users.map(u => u.id);
    }
}
export const automationService = new AutomationService();
