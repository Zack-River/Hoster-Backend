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
