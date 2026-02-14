import { Router } from "express";
import { providerController } from "../controllers/provider.controller";
import { isProvider } from "../middleware/provider.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
const router = Router();
// Configure Multer
const uploadsDir = path.join(process.cwd(), "uploads", "visit-photos");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
// Note: Serving static files should be in index.ts or similar, but adding route here for now?
// Actually `provider-routes.ts` did: app.use("/uploads/visit-photos", express.static(uploadsDir));
// I should probably move static serving to `server/index.ts`.
// For now, I'll focus on the upload route.
const visitPhotoUpload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadsDir),
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            cb(null, `${unique}${path.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/"))
            cb(null, true);
        else
            cb(new Error("Only images allowed"));
    },
});
router.get("/provider/auth-check", providerController.authCheck);
router.get("/provider/subscriptions", isProvider, providerController.getSubscriptions);
router.patch("/provider/subscriptions/:id/respond", isProvider, providerController.respondToSubscription);
router.post("/provider/visit-reports", isProvider, visitPhotoUpload.array("photos", 20), providerController.createVisitReport);
router.get("/provider/visit-reports", isProvider, providerController.getVisitReports);
router.get("/provider/reviews", isProvider, providerController.getReviews);
router.get("/provider/messages/:subscriptionId", isProvider, providerController.getMessages);
router.post("/provider/messages/:subscriptionId", isProvider, providerController.sendMessage);
router.get("/provider/profile", isProvider, providerController.getProfile);
export default router;
