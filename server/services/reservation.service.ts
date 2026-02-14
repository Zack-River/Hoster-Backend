import db from "../db";
import { Reservation, Listing, Channel, Prisma, ReservationStatus } from "@prisma/client";
import { listingService } from "./listing.service";

export class ReservationService {
  async getReservations(listingId: string): Promise<Reservation[]> {
    return db.reservation.findMany({ where: { listingId } });
  }

  async getReservationsByUser(userId: string): Promise<(Reservation & { listing: Listing; channel: Channel })[]> {
    const userListings = await listingService.getListings(userId);
    if (!userListings.length) return [];

    const listingIds = userListings.map((l) => l.id);
    return db.reservation.findMany({
      where: { listingId: { in: listingIds } },
      include: { listing: true, channel: true },
    });
  }

  async upsertReservation(data: any): Promise<Reservation> {
    const { channelId, externalReservationId, listingId, ...rest } = data; 

    return db.reservation.upsert({
      where: {
        channelId_externalReservationId: {
          channelId,
          externalReservationId,
        },
      },
      update: {
        ...rest,
        listing: { connect: { id: listingId } },
        updatedAt: new Date(),
      },
      create: {
        ...rest,
        externalReservationId,
        channel: { connect: { id: channelId } },
        listing: { connect: { id: listingId } },
      },
    });
  }

  async checkOverlap(listingId: string, checkIn: Date | string, checkOut: Date | string, excludeId?: string): Promise<Reservation[]> {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    return db.reservation.findMany({
      where: {
        listingId,
        status: "CONFIRMED",
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
  }

  async getUpcomingCheckIns(userId: string, date: string): Promise<(Reservation & { listing: Listing; channel: Channel })[]> {
    const userListings = await listingService.getListings(userId);
    if (!userListings.length) return [];
    const listingIds = userListings.map((l) => l.id);
    const dateObj = new Date(date);

    // findFirst allows only 1, but return type expects array. 
    // Drizzle code used limit(1) which returns array.
    const res = await db.reservation.findFirst({
      where: {
        listingId: { in: listingIds },
        checkIn: { gte: dateObj },
        status: "CONFIRMED",
      },
      orderBy: { checkIn: "asc" },
      include: { listing: true, channel: true },
    });
    return res ? [res] : [];
  }

  async getUpcomingCheckOuts(userId: string, date: string): Promise<(Reservation & { listing: Listing; channel: Channel })[]> {
    const userListings = await listingService.getListings(userId);
    if (!userListings.length) return [];
    const listingIds = userListings.map((l) => l.id);
    const dateObj = new Date(date);

    const res = await db.reservation.findFirst({
      where: {
        listingId: { in: listingIds },
        checkOut: { gte: dateObj },
        status: "CONFIRMED",
      },
      orderBy: { checkOut: "asc" },
      include: { listing: true, channel: true },
    });
    return res ? [res] : [];
  }

  async getReservationsByCheckIn(date: string): Promise<(Reservation & { listing: Listing; channel: Channel })[]> {
    const dateObj = new Date(date);
    return db.reservation.findMany({
      where: {
        checkIn: dateObj,
        status: "CONFIRMED",
      },
      include: { listing: true, channel: true },
    });
  }

  async getReservationsByCheckOut(date: string): Promise<(Reservation & { listing: Listing; channel: Channel })[]> {
    const dateObj = new Date(date);
    return db.reservation.findMany({
      where: {
        checkOut: dateObj,
        status: "CONFIRMED",
      },
      include: { listing: true, channel: true },
    });
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
    await db.reservation.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }

  async getReservationById(id: string): Promise<(Reservation & { listing: Listing; channel: Channel }) | null> {
    return db.reservation.findUnique({
      where: { id },
      include: { listing: true, channel: true },
    });
  }
}

export const reservationService = new ReservationService();
