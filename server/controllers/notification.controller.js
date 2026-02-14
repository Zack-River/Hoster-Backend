import { notificationService } from "../services/notification.service";
export class NotificationController {
    async getNotifications(req, res) {
        try {
            const userId = req.session.userId;
            const notifs = await notificationService.getNotifications(userId);
            const unreadCount = await notificationService.getUnreadCount(userId);
            res.json({
                notifications: notifs.map((n) => ({
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    body: n.body,
                    entityType: n.entityType,
                    entityId: n.entityId,
                    createdAt: n.createdAt?.toISOString() ?? "",
                    readAt: n.readAt?.toISOString() ?? null,
                })),
                unreadCount,
            });
        }
        catch (error) {
            console.error("Notifications error:", error);
            res.status(500).json({ message: "Failed to load notifications" });
        }
    }
    async markRead(req, res) {
        try {
            await notificationService.markRead(req.params.id);
            res.json({ success: true });
        }
        catch (error) {
            console.error("Mark notification read error:", error);
            res.status(500).json({ message: "Failed to mark as read" });
        }
    }
    async markAllRead(req, res) {
        try {
            const userId = req.session.userId;
            const notifs = await notificationService.getNotifications(userId);
            const unread = notifs.filter((n) => !n.readAt);
            for (const n of unread) {
                await notificationService.markRead(n.id);
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error("Mark all read error:", error);
            res.status(500).json({ message: "Failed to mark all as read" });
        }
    }
}
export const notificationController = new NotificationController();
