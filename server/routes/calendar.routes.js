import { Router } from "express";
import { calendarController } from "../controllers/calendar.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
const router = Router();
router.get("/calendar", isAuthenticated, calendarController.getCalendar);
router.post("/calendar/block", isAuthenticated, calendarController.blockDates);
export default router;
