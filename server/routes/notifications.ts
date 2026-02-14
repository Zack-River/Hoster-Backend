import { Express } from "express";
import { notificationService } from "../services/notification.service";
import { isAuthenticated } from "../middleware/auth.middleware";

function getUserId(req: any): string {
  return req.session?.userId;
}

export function registerNotificationRoutes(app: Express) {
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
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
    } catch (error) {
      console.error("Notifications error:", error);
      res.status(500).json({ message: "Failed to load notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
        await notificationService.markRead(req.params.id as string);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const notifs = await notificationService.getNotifications(userId);
      const unread = notifs.filter((n) => !n.readAt);
      for (const n of unread) {
        await notificationService.markRead(n.id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all read error:", error);
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });
}
