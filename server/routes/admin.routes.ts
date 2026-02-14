import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { isAdmin } from "../middleware/admin.middleware";

const router = Router();

router.get("/admin/auth-check", adminController.authCheck);
router.post("/admin/setup", adminController.setup);

// Protected Admin Routes
router.get("/admin/stats", isAdmin, adminController.getStats);
router.get("/admin/finance", isAdmin, adminController.getFinance);
router.get("/admin/users", isAdmin, adminController.getUsers);
router.post("/admin/users", isAdmin, adminController.createUser);
router.get("/admin/users/:id", isAdmin, adminController.getUserDetail);
router.patch("/admin/users/:id/block", isAdmin, adminController.blockUser);
router.patch("/admin/users/:id/role", isAdmin, adminController.changeUserRole);

// Admin Settings
router.patch("/admin/settings/password", isAdmin, adminController.changePassword);
router.patch("/admin/settings/profile", isAdmin, adminController.updateProfile);

// Provider Management
router.get("/admin/providers", isAdmin, adminController.getProviders);
router.post("/admin/providers", isAdmin, adminController.createProvider);
router.patch("/admin/providers/:id", isAdmin, adminController.updateProvider);
router.delete("/admin/providers/:id", isAdmin, adminController.deleteProvider);

// Provider Requests
router.get("/admin/provider-requests", isAdmin, adminController.getProviderRequests);
router.post("/admin/provider-requests", isAdmin, adminController.createProviderRequest);
router.patch("/admin/provider-requests/:id", isAdmin, adminController.updateProviderRequest);

// Provider Promotions
router.get("/admin/providers/:id/promotions", isAdmin, adminController.getProviderPromotions);
router.post("/admin/providers/:id/promotions", isAdmin, adminController.createProviderPromotion);
router.delete("/admin/promotions/:id", isAdmin, adminController.deleteProviderPromotion);

// Conversations & Support
router.get("/admin/conversations", isAdmin, adminController.getConversations);
router.get("/admin/conversations/:id/messages", isAdmin, adminController.getConversationMessages);
router.post("/admin/conversations/:id/send", isAdmin, adminController.sendMessage);

router.get("/admin/support-threads", isAdmin, adminController.getSupportThreads);
router.get("/admin/support-threads/:userId/messages", isAdmin, adminController.getSupportThreadMessages);
router.post("/admin/support-threads/:userId/send", isAdmin, adminController.sendSupportMessage);

export default router;
