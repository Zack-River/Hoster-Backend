import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await userService.getUser(userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
