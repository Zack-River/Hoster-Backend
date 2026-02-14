import { Router } from "express";
import { cleaningController } from "../controllers/cleaning.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
const router = Router();
// Host-facing cleaning marketplace routes
router.get("/cleaning/providers", isAuthenticated, cleaningController.getAllProviders);
router.post("/cleaning/subscribe", isAuthenticated, cleaningController.subscribe);
router.get("/cleaning/my-subscriptions", isAuthenticated, cleaningController.getMySubscriptions);
router.get("/cleaning/visit-reports/:id", isAuthenticated, cleaningController.getVisitReports); // :id is subscriptionId
router.post("/cleaning/reviews", isAuthenticated, cleaningController.createReview);
router.get("/cleaning/messages/:id", isAuthenticated, cleaningController.getMessages); // :id is subscriptionId
router.post("/cleaning/messages/:id", isAuthenticated, cleaningController.sendMessage); // :id is subscriptionId
export default router;
