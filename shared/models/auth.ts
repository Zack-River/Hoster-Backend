import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["host", "provider"]).default("host"),
});

export type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  country: string | null;
  phone: string | null;
  profileImageUrl: string | null;
  companyName: string | null;
  role: string;
  subscriptionPlan: string;
  blocked: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
};
