import { Express } from "express";
import { listingService } from "../services/listing.service";
import { channelService } from "../services/channel.service";
import { reservationService } from "../services/reservation.service";
import { messageService } from "../services/message.service";
import { notificationService } from "../services/notification.service";
import { cleaningService } from "../services/cleaning.service";
import { templateService } from "../services/template.service";
import { isAuthenticated } from "../middleware/auth.middleware";
import { format } from "date-fns";
import { ListingStatus } from "@prisma/client";

function getUserId(req: any): string {
  return req.session?.userId;
}

export function registerDashboardRoutes(app: Express) {
  app.get("/api/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
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
        allChannels
      ] = await Promise.all([
        reservationService.getUpcomingCheckIns(userId, today),
        reservationService.getUpcomingCheckOuts(userId, today),
        messageService.getTotalUnreadMessages(userId),
        channelService.getConnections(userId),
        notificationService.getNotifications(userId),
        listingService.getListings(userId),
        reservationService.getReservationsByUser(userId),
        cleaningService.getCleaningTasks(userId),
        channelService.getChannels()
      ]);

      const nextCheckIn = checkIns[0]
        ? {
            guestName: checkIns[0].guestName,
            channelKey: checkIns[0].channel?.key,
            date: checkIns[0].checkIn,
            listingName: checkIns[0].listing?.name,
          }
        : null;

      const nextCheckOut = checkOuts[0]
        ? {
            reservationId: checkOuts[0].id,
            guestName: checkOuts[0].guestName,
            channelKey: checkOuts[0].channel?.key,
            date: checkOuts[0].checkOut,
            listingName: checkOuts[0].listing?.name,
          }
        : null;

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
        const maps = await channelService.getExternalListingMaps(listing.id);
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
          monthRevenue += parseFloat(r.totalAmount as any); // Decimal
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
          listingName: r.listing?.name,
          channelKey: r.channel?.key,
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
          listingName: r.listing?.name,
          channelKey: r.channel?.key,
          totalAmount: r.totalAmount,
          currency: r.currency || "USD",
        }));

      const pendingCleaningTasks = allCleaningTasks
        .filter(t => t.status !== "COMPLETED")
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          listingName: t.listing?.name,
          guestName: t.reservation?.guestName,
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
  });

  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const [allChannels, connections, userListings, tmpls, reminder, allReservations] = await Promise.all([
        channelService.getChannels(),
        channelService.getConnections(userId),
        listingService.getListings(userId),
        templateService.getTemplates(userId),
        notificationService.getReminderSettings(userId),
        reservationService.getReservationsByUser(userId),
      ]);

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

      const connectedChannelKeys = connections
        .filter((c) => c.status === "CONNECTED" || c.status === "ERROR")
        .map((c) => c.channel.key);

      const listingsWithChannels = await Promise.all(
        userListings.map(async (listing) => {
          const maps = await channelService.getExternalListingMaps(listing.id);
          const listingReservations = allReservations.filter(
            (r) => r.listingId === listing.id && r.totalAmount
          );
          const avgPrice = listingReservations.length > 0
            ? Math.round(
                listingReservations.reduce(
                  (sum, r) => sum + parseFloat(r.totalAmount as any || "0"),
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
  });
}
