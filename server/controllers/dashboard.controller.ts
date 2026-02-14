import { Request, Response } from "express";
import { format } from "date-fns";
import { reservationService } from "../services/reservation.service";
import { messageService } from "../services/message.service";
import { channelService } from "../services/channel.service";
import { notificationService } from "../services/notification.service";
import { listingService } from "../services/listing.service";
import { cleaningService } from "../services/cleaning.service";
import { templateService } from "../services/template.service";

export class DashboardController {
  async getDashboard(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const today = format(new Date(), "yyyy-MM-dd");

      const [
        checkIns,
        checkOuts,
        unreadMessages,
        channelConns,
        notifs,
        userListings,
        allReservations,
        allCleaningTasks,
      ] = await Promise.all([
        reservationService.getUpcomingCheckIns(userId, today),
        reservationService.getUpcomingCheckOuts(userId, today),
        messageService.getTotalUnreadMessages(userId),
        channelService.getConnections(userId),
        notificationService.getNotifications(userId),
        listingService.getListings(userId),
        reservationService.getReservationsByUser(userId),
        cleaningService.getCleaningTasks(userId),
      ]);

      const nextCheckIn = checkIns[0]
        ? {
            guestName: checkIns[0].guestName,
            channelKey: checkIns[0].channel.key,
            date: checkIns[0].checkIn,
            listingName: checkIns[0].listing.name,
          }
        : null;

      const nextCheckOut = checkOuts[0]
        ? {
            reservationId: checkOuts[0].id,
            guestName: checkOuts[0].guestName,
            channelKey: checkOuts[0].channel.key,
            date: checkOuts[0].checkOut,
            listingName: checkOuts[0].listing.name,
          }
        : null;

      const allChannels = await channelService.getChannels();
      const channelStatuses = channelConns.map((cc) => ({
        channelKey: cc.channel.key,
        name: cc.channel.name,
        status: cc.status,
        lastSyncAt: cc.lastSyncAt?.toISOString() ?? null,
        lastError: cc.lastError,
      }));

      const connectedChannelKeys = channelConns
        .filter((c) => c.status === "CONNECTED" || c.status === "ERROR")
        .map((c) => c.channel.key);

      let hasMappingIssue = false;
      let hasSyncError = channelConns.some((c) => c.status === "ERROR");

      for (const listing of userListings) {
        const maps = await listingService.getExternalListingMaps(listing.id);
        for (const key of connectedChannelKeys) {
          const ch = allChannels.find((c) => c.key === key);
          if (ch && !maps.some((m) => m.channelId === ch.id)) {
            hasMappingIssue = true;
            break;
          }
        }
        if (hasMappingIssue) break;
      }

      const recentNotifications = notifs
        .filter((n) => !n.readAt)
        .slice(0, 10)
        .map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          createdAt: n.createdAt?.toISOString() ?? "",
        }));

      const todayDate = new Date(today);
      const occupiedListingIds = new Set<string>();
      const confirmedReservations = allReservations.filter(r => r.status === "CONFIRMED" || r.status === "CHECKED_IN");
      for (const r of confirmedReservations) {
        const ci = new Date(r.checkIn);
        const co = new Date(r.checkOut);
        if (ci <= todayDate && co > todayDate) {
          occupiedListingIds.add(r.listingId);
        }
      }
      const totalListings = userListings.filter(l => l.status === "ACTIVE").length;
      const occupiedCount = occupiedListingIds.size;
      const availableCount = totalListings - occupiedCount;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      let monthRevenue = 0;
      for (const r of confirmedReservations) {
        const ci = new Date(r.checkIn);
        const co = new Date(r.checkOut);
        if (ci <= monthEnd && co >= monthStart && r.totalAmount) {
          monthRevenue += parseFloat(r.totalAmount as any);
        }
      }

      const upcomingReservations = allReservations
        .filter(r => (r.status === "CONFIRMED") && new Date(r.checkIn) >= todayDate)
        .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
        .slice(0, 5)
        .map(r => ({
          id: r.id,
          guestName: r.guestName,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          listingName: r.listing.name,
          channelKey: r.channel.key,
          totalAmount: r.totalAmount,
          currency: r.currency || "USD",
        }));

      const occupancyRate = totalListings > 0 ? Math.round((occupiedCount / totalListings) * 100) : 0;

      const pendingReservations = allReservations
        .filter(r => r.status === "PENDING")
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 10)
        .map(r => ({
          id: r.id,
          guestName: r.guestName,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          listingName: r.listing.name,
          channelKey: r.channel.key,
          totalAmount: r.totalAmount,
          currency: r.currency || "USD",
        }));

      const pendingCleaningTasks = allCleaningTasks
        .filter(t => t.status !== "COMPLETED")
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          listingName: t.listing.name,
          guestName: t.reservation.guestName,
          cleaningCompany: t.cleaningCompany,
          cleaningCompanyPhone: t.cleaningCompanyPhone,
          status: t.status,
          scheduledAt: t.scheduledAt?.toISOString() ?? null,
        }));

      res.json({
        nextCheckIn,
        nextCheckOut,
        unreadMessages,
        channelStatuses,
        notifications: recentNotifications,
        totalListings,
        availableCount,
        occupiedCount,
        occupancyRate,
        monthRevenue,
        upcomingReservations,
        hasMappingIssue,
        hasSyncError,
        pendingReservations,
        pendingCleaningTasks,
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  }

  async getSettings(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const allChannels = await channelService.getChannels();
      const connections = await channelService.getConnections(userId);
      const userListings = await listingService.getListings(userId);
      const tmpls = await templateService.getTemplates(userId);
      const reminder = await notificationService.getReminderSettings(userId);

      const channelStatuses = allChannels.map((ch) => {
        const conn = connections.find((c) => c.channelId === ch.id);
        return {
          channelKey: ch.key,
          channelId: ch.id,
          name: ch.name,
          status: conn?.status ?? "DISCONNECTED",
          lastSyncAt: conn?.lastSyncAt?.toISOString() ?? null,
          lastError: conn?.lastError ?? null,
        };
      });

      const allReservations = await reservationService.getReservationsByUser(userId);

      const connectedChannelKeys = connections
        .filter((c) => c.status === "CONNECTED" || c.status === "ERROR")
        .map((c) => c.channel.key);

      const listingsWithChannels = await Promise.all(
        userListings.map(async (listing) => {
          const maps = await listingService.getExternalListingMaps(listing.id);
          const listingReservations = allReservations.filter(
            (r) => r.listingId === listing.id && r.totalAmount
          );
          const avgPrice = listingReservations.length > 0
            ? Math.round(
                listingReservations.reduce(
                  (sum, r) => sum + parseFloat((r.totalAmount as any) || "0"),
                  0
                ) / listingReservations.length
              )
            : null;

          const mappingStatus = connectedChannelKeys.map((key) => {
            const ch = allChannels.find((c) => c.key === key);
            const isMapped = ch ? maps.some((m) => m.channelId === ch.id) : false;
            return {
              channelKey: key,
              channelName: ch?.name ?? key,
              mapped: isMapped,
            };
          });

          return {
            ...listing,
            avgPrice,
            currency: listingReservations[0]?.currency || "USD",
            channels: maps.map((m) => ({
              channelKey: m.channel.key,
              channelName: m.channel.name,
            })),
            mappingStatus,
          };
        })
      );

      res.json({
        channels: channelStatuses,
        listings: listingsWithChannels,
        templates: tmpls,
        reminderSettings: reminder ?? null,
      });
    } catch (error) {
      console.error("Settings error:", error);
      res.status(500).json({ message: "Failed to load settings" });
    }
  }
}

export const dashboardController = new DashboardController();
