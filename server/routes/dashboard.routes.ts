import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard", isAuthenticated, dashboardController.getDashboard);
router.get("/settings", isAuthenticated, dashboardController.getSettings);

export default router;
