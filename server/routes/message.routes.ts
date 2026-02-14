import { Router } from "express";
import { messageController } from "../controllers/message.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.get("/inbox", isAuthenticated, messageController.getInbox);
router.get("/chat/:id", isAuthenticated, messageController.getChat);
router.post("/chat/:id/send", isAuthenticated, messageController.sendMessage);
router.get("/support/messages", isAuthenticated, messageController.getSupportMessages);
router.post("/support/send", isAuthenticated, messageController.sendSupportMessage);

export default router;
