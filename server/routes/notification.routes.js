import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
const router = Router();
router.get("/notifications", isAuthenticated, notificationController.getNotifications);
router.patch("/notifications/:id/read", isAuthenticated, notificationController.markRead);
router.post("/notifications/read-all", isAuthenticated, notificationController.markAllRead);
export default router;
