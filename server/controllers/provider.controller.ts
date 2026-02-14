import { Request, Response } from "express";
import { providerService } from "../services/provider.service";
import { userService } from "../services/user.service";
import { z } from "zod";
import path from "path";
import fs from "fs";

export class ProviderController {
  async authCheck(req: Request, res: Response) {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.json({ isProvider: false, user: null });
    const user = await userService.getUser(userId);
    if (!user || user.role !== "provider") return res.json({ isProvider: false, user: null });
    res.json({
      isProvider: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        companyName: user.companyName,
        profileImageUrl: user.profileImageUrl,
      },
    });
  }

  async getSubscriptions(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const subs = await providerService.getSubscriptions(providerId);
      res.json(subs);
    } catch (error) {
      console.error("Provider subscriptions error:", error);
      res.status(500).json({ message: "Failed to load subscriptions" });
    }
  }

  async respondToSubscription(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const schema = z.object({
        status: z.enum(["ACCEPTED", "DECLINED"]),
        declineMessage: z.string().optional(),
      });
      const { status, declineMessage } = schema.parse(req.body);
      await providerService.respondToSubscription(req.params.id as string, providerId, status, declineMessage);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Subscription respond error:", error);
      res.status(500).json({ message: error.message || "Failed to respond to subscription" });
    }
  }

  async createVisitReport(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const { subscriptionId, listingId, notes, visitDate } = req.body;

      if (!subscriptionId || !listingId || !visitDate) {
        return res.status(400).json({ message: "subscriptionId, listingId, and visitDate required" });
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 8) {
        return res.status(400).json({ message: "At least 8 photos required" });
      }

      const photoUrls = files.map(f => `/uploads/visit-photos/${f.filename}`);

      const report = await providerService.createVisitReport({
        subscription: { connect: { id: subscriptionId } },
        provider: { connect: { id: providerId } },
        listing: { connect: { id: listingId } },
        photos: photoUrls,
        notes,
        visitDate,
      } as any);

      res.json(report);
    } catch (error: any) {
      console.error("Visit report error:", error);
      res.status(500).json({ message: error.message || "Failed to create visit report" });
    }
  }

  async getVisitReports(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const reports = await providerService.getVisitReports(providerId);
      res.json(reports);
    } catch (error) {
      console.error("Visit reports error:", error);
      res.status(500).json({ message: "Failed to load visit reports" });
    }
  }

  async getReviews(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const reviews = await providerService.getReviews(providerId);
      res.json(reviews);
    } catch (error) {
      console.error("Provider reviews error:", error);
      res.status(500).json({ message: "Failed to load reviews" });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const msgs = await providerService.getMessages(req.params.subscriptionId as string, providerId);
      res.json(msgs);
    } catch (error: any) {
      console.error("Provider messages error:", error);
      res.status(500).json({ message: error.message || "Failed to load messages" });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const { body } = req.body;
      if (!body?.trim()) return res.status(400).json({ message: "Message body required" });

      const msg = await providerService.sendMessage(req.params.subscriptionId as string, providerId, body);
      res.json(msg);
    } catch (error: any) {
      console.error("Send provider message error:", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const providerId = (req.session as any).userId;
      const profile = await providerService.getProfile(providerId);
      if (!profile) return res.status(404).json({ message: "User not found" });
      res.json(profile);
    } catch (error) {
      console.error("Provider profile error:", error);
      res.status(500).json({ message: "Failed to load profile" });
    }
  }
}

export const providerController = new ProviderController();
