import { Request, Response } from "express";
import { providerService } from "../services/provider.service";
import { z } from "zod";

export class CleaningController {
  async getAllProviders(req: Request, res: Response) {
    try {
      const providers = await providerService.getAllProviders();
      res.json(providers);
    } catch (error) {
      console.error("Get cleaning providers error:", error);
      res.status(500).json({ message: "Failed to load providers" });
    }
  }

  async subscribe(req: Request, res: Response) {
    try {
      const hostId = (req.session as any).userId;
      const schema = z.object({
        providerId: z.string().min(1),
        listingIds: z.array(z.string()).optional(),
      });
      const data = schema.parse(req.body);
      const sub = await providerService.subscribe(hostId, data);
      res.json(sub);
    } catch (error: any) {
      console.error("Subscribe to provider error:", error);
      res.status(500).json({ message: error.message || "Failed to subscribe" });
    }
  }

  async getMySubscriptions(req: Request, res: Response) {
    try {
      const hostId = (req.session as any).userId;
      const subs = await providerService.getHostSubscriptions(hostId);
      res.json(subs);
    } catch (error) {
      console.error("Get my subscriptions error:", error);
      res.status(500).json({ message: "Failed to load subscriptions" });
    }
  }

  async getVisitReports(req: Request, res: Response) {
    try {
      const hostId = (req.session as any).userId;
      const subscriptionId = req.params.id; // Correct parameter usage
      // Wait, endpoint is /api/cleaning/visit-reports/:id? No, usually by subscription or listing?
      // Legacy was /api/cleaning/visit-reports/:id where id is subscriptionId based on context?
      // Looking at legacy `provider-routes.ts`:
      // app.get("/api/cleaning/visit-reports/:id" ... -> const subscriptionId = req.params.id;
      // Yes.
      const reports = await providerService.getHostVisitReports(hostId, subscriptionId as string);
      res.json(reports);
    } catch (error: any) {
      console.error("Get host visit reports error:", error);
      res.status(500).json({ message: error.message || "Failed to load visit reports" });
    }
  }

  async createReview(req: Request, res: Response) {
    try {
      const hostId = (req.session as any).userId;
      const schema = z.object({
        subscriptionId: z.string(),
        visitReportId: z.string(),
        providerId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const review = await providerService.createReview(hostId, data);
      res.json(review);
    } catch (error: any) {
      console.error("Create review error:", error);
      res.status(500).json({ message: error.message || "Failed to submit review" });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const hostId = (req.session as any).userId;
      const subscriptionId = req.params.id; // /api/cleaning/messages/:id
      const msgs = await providerService.getHostMessages(subscriptionId as string, hostId);
      res.json(msgs);
    } catch (error: any) {
      console.error("Get host messages error:", error);
      res.status(500).json({ message: error.message || "Failed to load messages" });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const hostId = (req.session as any).userId;
      const subscriptionId = req.params.id;
      const { body } = req.body;
      if (!body?.trim()) return res.status(400).json({ message: "Message body required" });

      const msg = await providerService.sendHostMessage(subscriptionId as string, hostId, body);
      res.json(msg);
    } catch (error: any) {
      console.error("Send host message error:", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  }
}

export const cleaningController = new CleaningController();
