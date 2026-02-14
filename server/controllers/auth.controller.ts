import { Request, Response } from "express";
import { userService } from "../services/user.service";
import bcrypt from "bcryptjs";
import { z } from "zod";
import db from "../db";

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        country: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["host", "provider"]).default("host"),
      });

      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password, firstName, lastName, country, phone, role } = parsed.data;

      const existing = await userService.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await userService.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        country: country || null,
        phone: phone || null,
        role: role || "host",
      });

      (req.session as any).userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        companyName: user.companyName,
        crNumber: user.crNumber,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const loginSchema = z.object({
        email: z.string().email(),
        password: z.string().min(1),
      });

      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const { email, password } = parsed.data;

      const user = await userService.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      (req.session as any).userId = user.id;

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        companyName: user.companyName,
        crNumber: user.crNumber,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  }

  logout(req: Request, res: Response) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  }

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const user = await userService.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        companyName: user.companyName,
        crNumber: user.crNumber,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        blocked: user.blocked,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const schema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        country: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        companyName: z.string().optional(),
        crNumber: z.string().optional(),
        profileImageUrl: z.string().optional(),
      });
      const updates = schema.parse(req.body);
      const user = await userService.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        country: user.country,
        phone: user.phone,
        profileImageUrl: user.profileImageUrl,
        companyName: user.companyName,
        crNumber: user.crNumber,
        subscriptionPlan: user.subscriptionPlan,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }

  async getSubscription(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const user = await userService.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const listingCount = await db.listing.count({ where: { userId } });

      const plans = [
        { key: "light", name: "Light", maxUnits: 1, price: 0, description: "Perfect for getting started with 1 unit" },
        { key: "growth", name: "Growth", maxUnits: 5, price: 19, description: "Manage up to 5 units" },
        { key: "expanding", name: "Expanding", maxUnits: 15, price: 39, description: "Scale up to 15 units" },
      ];

      const currentPlan = user.subscriptionPlan || "light";
      const plan = plans.find(p => p.key === currentPlan) || plans[0];

      res.json({
        currentPlan: plan.key,
        currentPlanName: plan.name,
        price: plan.price,
        maxUnits: plan.maxUnits,
        unitCount: listingCount,
        plans,
      });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "Failed to load subscription" });
    }
  }

  async updateSubscription(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const schema = z.object({ plan: z.enum(["light", "growth", "expanding"]) });
      const { plan } = schema.parse(req.body);

      const user = await userService.updateUser(userId, { subscriptionPlan: plan });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ success: true, plan });
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  }
}

export const authController = new AuthController();
