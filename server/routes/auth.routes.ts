import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/user", isAuthenticated, authController.getCurrentUser);
router.patch("/user", isAuthenticated, authController.updateProfile);
router.get("/subscription", isAuthenticated, authController.getSubscription);
router.patch("/subscription", isAuthenticated, authController.updateSubscription);

export default router;
