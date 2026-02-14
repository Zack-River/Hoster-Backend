import { Request, Response } from "express";
import { adminService } from "../services/admin.service";
import { userService } from "../services/user.service";
import { z } from "zod";
import bcrypt from "bcryptjs";
import db from "../db";

export class AdminController {
  async authCheck(req: Request, res: Response) {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.json({ isAdmin: false });
    }
    const user = await userService.getUser(userId);
    res.json({ isAdmin: user?.role === "admin" });
  }

  async setup(req: Request, res: Response) {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      await adminService.setupAdmin(userId);
      res.json({ success: true, message: "You are now an admin" });
    } catch (error: any) {
      console.error("Admin setup error:", error);
      res.status(500).json({ message: (error as Error).message || "Failed to set up admin" });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await adminService.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to load admin stats" });
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const search = String(req.query.search || "");
      const role = String(req.query.role || "");
      const users = await adminService.getUsers(search, role);
      res.json(users);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to load admin users" });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const bodySchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["host", "provider", "admin"]).default("host"),
        phone: z.string().optional().nullable(),
        country: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
        subscriptionPlan: z.enum(["light", "growth", "expanding"]).default("light"),
      });
      const parsed = bodySchema.parse(req.body);
      const user = await adminService.createUser(parsed);
      res.json(user);
    } catch (error: any) {
      console.error("Admin create user error:", error);
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: (error as Error).message || "Failed to create user" });
    }
  }

  async getUserDetail(req: Request, res: Response) {
    try {
      const userId = String(req.params.id);
      const detail = await adminService.getUserDetail(userId);
      if (!detail) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(detail);
    } catch (error) {
      console.error("Admin user detail error:", error);
      res.status(500).json({ message: "Failed to load user detail" });
    }
  }

  async blockUser(req: Request, res: Response) {
    try {
      const userId = String(req.params.id);
      const bodySchema = z.object({ blocked: z.boolean() });
      const { blocked } = bodySchema.parse(req.body);
      await adminService.setUserBlocked(userId, blocked);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin block user error:", error);
      res.status(500).json({ message: "Failed to update user blocked status" });
    }
  }

  async changeUserRole(req: Request, res: Response) {
    try {
      const userId = String(req.params.id);
      const bodySchema = z.object({ role: z.enum(["host", "admin", "provider"]) });
      const { role } = bodySchema.parse(req.body);
      await adminService.setUserRole(userId, role);
      res.json({ success: true });
    } catch (error) {
      console.error("Admin change role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  }

  async getFinance(req: Request, res: Response) {
    try {
      const data = await adminService.getFinanceData();
      res.json(data);
    } catch (error) {
      console.error("Admin finance error:", error);
      res.status(500).json({ message: "Failed to load finance data" });
    }
  }

  async getProviders(req: Request, res: Response) {
    try {
      const typeFilter = req.query.type as any;
      const providers = await adminService.getProviders(typeFilter);
      res.json(providers);
    } catch (error) {
      console.error("Admin providers error:", error);
      res.status(500).json({ message: "Failed to load providers" });
    }
  }

  async createProvider(req: Request, res: Response) {
    try {
      const bodySchema = z.object({
        name: z.string().min(1),
        type: z.enum(["CLEANING", "MAINTENANCE"]),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        commissionRate: z.string().optional().nullable(),
      });
      const parsed = bodySchema.parse(req.body);
      const provider = await adminService.createProvider(parsed);
      res.json(provider);
    } catch (error) {
      console.error("Admin create provider error:", error);
      res.status(500).json({ message: "Failed to create provider" });
    }
  }

  async updateProvider(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const bodySchema = z.object({
        name: z.string().min(1).optional(),
        type: z.enum(["CLEANING", "MAINTENANCE"]).optional(),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        commissionRate: z.string().optional().nullable(),
        status: z.enum(["active", "inactive"]).optional(),
      });
      const parsed = bodySchema.parse(req.body);
      const provider = await adminService.updateProvider(id, parsed);
      if (!provider) return res.status(404).json({ message: "Provider not found" });
      res.json(provider);
    } catch (error) {
      console.error("Admin update provider error:", error);
      res.status(500).json({ message: "Failed to update provider" });
    }
  }

  async deleteProvider(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await adminService.deleteProvider(id);
      if (!deleted) return res.status(404).json({ message: "Provider not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete provider error:", error);
      res.status(500).json({ message: "Failed to delete provider" });
    }
  }

  async getProviderRequests(req: Request, res: Response) {
    try {
      const requests = await adminService.getProviderRequests();
      res.json(requests);
    } catch (error) {
      console.error("Admin provider requests error:", error);
      res.status(500).json({ message: "Failed to load provider requests" });
    }
  }

  async createProviderRequest(req: Request, res: Response) {
    try {
      const bodySchema = z.object({
        name: z.string().min(1),
        type: z.enum(["CLEANING", "MAINTENANCE"]),
        email: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
        companyName: z.string().optional().nullable(),
        message: z.string().optional().nullable(),
      });
      const parsed = bodySchema.parse(req.body);
      const request = await adminService.createProviderRequest(parsed);
      res.json(request);
    } catch (error) {
      console.error("Admin create provider request error:", error);
      res.status(500).json({ message: "Failed to create provider request" });
    }
  }

  async updateProviderRequest(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const bodySchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });
      const { status } = bodySchema.parse(req.body);
      const request = await adminService.updateProviderRequest(id, status);
      if (!request) return res.status(404).json({ message: "Request not found" });
      res.json(request);
    } catch (error) {
      console.error("Admin update provider request error:", error);
      res.status(500).json({ message: "Failed to update provider request" });
    }
  }

  async getProviderPromotions(req: Request, res: Response) {
    try {
      const providerId = String(req.params.id);
      const promos = await adminService.getProviderPromotions(providerId);
      res.json(promos);
    } catch (error) {
      console.error("Admin provider promotions error:", error);
      res.status(500).json({ message: "Failed to load promotions" });
    }
  }

  async createProviderPromotion(req: Request, res: Response) {
    try {
      const providerId = String(req.params.id);
      const bodySchema = z.object({
        title: z.string().min(1),
        description: z.string().optional().nullable(),
        discountPercent: z.string().optional().nullable(),
        validFrom: z.string().optional().nullable(),
        validUntil: z.string().optional().nullable(),
      });
      const parsed = bodySchema.parse(req.body);
      const promo = await adminService.createPromotion(providerId, parsed);
      res.json(promo);
    } catch (error) {
      console.error("Admin create promotion error:", error);
      res.status(500).json({ message: "Failed to create promotion" });
    }
  }

  async deleteProviderPromotion(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const deleted = await adminService.deletePromotion(id);
      if (!deleted) return res.status(404).json({ message: "Promotion not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete promotion error:", error);
      res.status(500).json({ message: "Failed to delete promotion" });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req.session as any)?.userId;
      const bodySchema = z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      });
      const { currentPassword, newPassword } = bodySchema.parse(req.body);
      
      const user = await userService.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

      const hashed = await bcrypt.hash(newPassword, 10);
      await userService.updateUser(userId, { password: hashed });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Admin change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req.session as any)?.userId;
      const bodySchema = z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        profileImageUrl: z.string().optional().nullable(),
      });
      const parsed = bodySchema.parse(req.body);
      await userService.updateUser(userId, parsed);
      const user = await userService.getUser(userId);
      res.json({
        id: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profileImageUrl: user?.profileImageUrl,
      });
    } catch (error) {
      console.error("Admin update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }

  async getConversations(req: Request, res: Response) {
    try {
      const convos = await adminService.getConversations();
      res.json(convos);
    } catch (error) {
      console.error("Admin conversations error:", error);
      res.status(500).json({ message: "Failed to load conversations" });
    }
  }

  async getConversationMessages(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const msgs = await adminService.getConversationMessages(id);
      res.json(msgs);
    } catch (error) {
      console.error("Admin messages error:", error);
      res.status(500).json({ message: "Failed to load messages" });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const bodySchema = z.object({ body: z.string().min(1) });
      const { body } = bodySchema.parse(req.body);
      const msg = await adminService.sendMessage(id, body);
      res.json(msg);
    } catch (error) {
      console.error("Admin send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  }

  async getSupportThreads(req: Request, res: Response) {
    try {
      const threads = await adminService.getSupportThreads();
      res.json(threads);
    } catch (error) {
      console.error("Admin support threads error:", error);
      res.status(500).json({ message: "Failed to load support threads" });
    }
  }

  async getSupportThreadMessages(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId || "");
      const msgs = await adminService.getSupportThreadMessages(userId);
      res.json(msgs);
    } catch (error) {
      console.error("Admin support messages error:", error);
      res.status(500).json({ message: "Failed to load messages" });
    }
  }

  async sendSupportMessage(req: Request, res: Response) {
    try {
      const userId = String(req.params.userId || "");
      const bodySchema = z.object({ body: z.string().min(1) });
      const { body } = bodySchema.parse(req.body);
      const msg = await adminService.sendSupportMessage(userId, body);
      res.json(msg);
    } catch (error) {
      console.error("Admin send support message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  }
}

export const adminController = new AdminController();
