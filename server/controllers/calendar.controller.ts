import { Request, Response } from "express";
import { listingService } from "../services/listing.service";
import { reservationService } from "../services/reservation.service";
import { calendarService } from "../services/calendar.service";
import { channelService } from "../services/channel.service";
import { getProvider } from "../providers";
import { z } from "zod";

type ChannelKey = "AIRBNB" | "BOOKING" | "EXPEDIA" | "TRIPADVISOR";

export class CalendarController {
  async getCalendar(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const userListings = await listingService.getListings(userId);

      const listingsWithChannels = await Promise.all(
        userListings.map(async (listing) => {
          const maps = await listingService.getExternalListingMaps(listing.id);
          return {
            ...listing,
            channels: maps.map((m) => ({
              channelKey: m.channel.key,
              channelName: m.channel.name,
            })),
          };
        })
      );

      const channelConnections = await channelService.getConnections(userId);
      const channelMap = new Map<string, string>();
      for (const conn of channelConnections) {
        channelMap.set(conn.channelId, conn.channel.key);
      }

      const allReservations: any[] = [];
      const allCalendarDays: any[] = [];
      for (const listing of userListings) {
        const [ress, cdays] = await Promise.all([
          reservationService.getReservations(listing.id),
          calendarService.getCalendarDays(listing.id),
        ]);
        for (const r of ress) {
          allReservations.push({
            ...r,
            channelKey: channelMap.get(r.channelId) || null,
          });
        }
        allCalendarDays.push(...cdays);
      }

      res.json({
        listings: listingsWithChannels,
        reservations: allReservations,
        calendarDays: allCalendarDays,
      });
    } catch (error) {
      console.error("Calendar error:", error);
      res.status(500).json({ message: "Failed to load calendar" });
    }
  }

  async blockDates(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const schema = z.object({
        listingId: z.string(),
        date: z.string(),
        block: z.boolean(),
      });
      const { listingId, date, block } = schema.parse(req.body);

      const listing = await listingService.getListingById(listingId);
      if (!listing || listing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (block) {
        await calendarService.upsertCalendarDay({
          listingId,
          date,
          status: "BLOCKED",
          source: "MANUAL",
        });
      } else {
        await calendarService.deleteCalendarDay(listingId, date);
      }

      const maps = await listingService.getExternalListingMaps(listingId);
      const channelResults: Array<{ channelKey: string; channelName: string; success: boolean; error?: string }> = [];

      for (const map of maps) {
        try {
          const provider = getProvider(map.channel.key as ChannelKey);
          await provider.pushCalendarBlock(
            map.externalListingId,
            { start: date, end: date },
            block
          );
          channelResults.push({ channelKey: map.channel.key, channelName: map.channel.name, success: true });
        } catch (err) {
          console.error(`Failed to push block to ${map.channel.key}:`, err);
          channelResults.push({ channelKey: map.channel.key, channelName: map.channel.name, success: false, error: (err as Error).message });
        }
      }

      res.json({ success: true, channelResults });
    } catch (error) {
      console.error("Calendar block error:", error);
      res.status(500).json({ message: "Failed to update calendar" });
    }
  }
}

export const calendarController = new CalendarController();
