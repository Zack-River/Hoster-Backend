import { Request, Response } from "express";
import { reservationService } from "../services/reservation.service";
import { cleaningService } from "../services/cleaning.service";
import { notificationService } from "../services/notification.service";
import { z } from "zod";

export class ReservationController {
  async accept(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const reservation = await reservationService.getReservationById(req.params.id as string);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (reservation.listing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (reservation.status !== "PENDING") {
        return res.status(400).json({ message: "Reservation is not pending" });
      }
      await reservationService.updateReservationStatus(reservation.id, "CONFIRMED");
      res.json({ success: true });
    } catch (error) {
      console.error("Accept reservation error:", error);
      res.status(500).json({ message: "Failed to accept reservation" });
    }
  }

  async reject(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const reservation = await reservationService.getReservationById(req.params.id as string);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (reservation.listing.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
      if (reservation.status !== "PENDING") {
        return res.status(400).json({ message: "Reservation is not pending" });
      }
      await reservationService.updateReservationStatus(reservation.id, "REJECTED");
      res.json({ success: true });
    } catch (error) {
      console.error("Reject reservation error:", error);
      res.status(500).json({ message: "Failed to reject reservation" });
    }
  }

  async checkout(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const schema = z.object({
        reservationId: z.string(),
        cleaningCompany: z.string(),
        cleaningCompanyPhone: z.string().optional(),
        notes: z.string().optional(),
      });
      const body = schema.parse(req.body);

      const allRes = await reservationService.getReservationsByUser(userId);
      const reservation = allRes.find(r => r.id === body.reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      if (reservation.status === "CHECKED_OUT" || reservation.status === "CANCELED") {
        return res.status(400).json({ message: "Reservation already checked out or canceled" });
      }

      const existingTasks = await cleaningService.getCleaningTasks(userId);
      if (existingTasks.some(t => t.reservationId === body.reservationId)) {
        return res.status(400).json({ message: "Cleaning task already exists for this reservation" });
      }

      await reservationService.updateReservationStatus(body.reservationId, "CHECKED_OUT");

      const cleaningTask = await cleaningService.createCleaningTask({
        user: { connect: { id: userId } },
        reservationId: body.reservationId,
        listingId: reservation.listingId,
        cleaningCompany: body.cleaningCompany,
        cleaningCompanyPhone: body.cleaningCompanyPhone || null,
        status: "PENDING",
        notes: body.notes || null,
      } as any);

      await notificationService.createNotification({
        userId,
        type: "CLEANING_SCHEDULED",
        title: "Cleaning scheduled",
        body: `${body.cleaningCompany} has been notified to clean ${reservation.listing.name} after ${reservation.guestName}'s checkout.`,
        entityType: "cleaning_task",
        entityId: cleaningTask.id,
      });

      res.json({ success: true, cleaningTask });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to checkout" });
    }
  }
}

export const reservationController = new ReservationController();
