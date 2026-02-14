import db from "../db";
export class NotificationService {
    async getReminderSettings(userId) {
        return db.reminderSettings.findUnique({ where: { userId } });
    }
    async upsertReminderSettings(data) {
        const { userId, ...rest } = data;
        return db.reminderSettings.upsert({
            where: { userId },
            update: { ...rest },
            create: {
                ...rest,
                user: { connect: { id: userId } }
            },
        });
    }
    async getNotifications(userId) {
        return db.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    }
    async createNotification(data) {
        const { userId, ...rest } = data;
        return db.notification.create({
            data: {
                ...rest,
                user: { connect: { id: userId } }
            }
        });
    }
    async markRead(id) {
        await db.notification.update({
            where: { id },
            data: { readAt: new Date() }
        });
    }
    async getUnreadCount(userId) {
        return db.notification.count({
            where: {
                userId,
                readAt: null
            }
        });
    }
}
export const notificationService = new NotificationService();
