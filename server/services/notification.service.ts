import db from "../db";
import { Notification, ReminderSettings, Prisma } from "@prisma/client";

export class NotificationService {
  async getReminderSettings(userId: string): Promise<ReminderSettings | null> {
    return db.reminderSettings.findUnique({ where: { userId } });
  }

  async upsertReminderSettings(data: any): Promise<ReminderSettings> {
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

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async createNotification(data: any): Promise<Notification> {
    const { userId, ...rest } = data;
    return db.notification.create({
      data: {
        ...rest,
        user: { connect: { id: userId } }
      }
    });
  }

  async markRead(id: string): Promise<void> {
    await db.notification.update({
        where: { id },
        data: { readAt: new Date() }
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return db.notification.count({
        where: {
            userId,
            readAt: null
        }
    });
  }
}

export const notificationService = new NotificationService();
