import { Router } from "express";
import { reservationController } from "../controllers/reservation.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
const router = Router();
router.post("/reservations/:id/accept", isAuthenticated, reservationController.accept);
router.post("/reservations/:id/reject", isAuthenticated, reservationController.reject);
router.post("/checkout", isAuthenticated, reservationController.checkout);
export default router;
