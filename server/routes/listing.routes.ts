import { Router } from "express";
import { listingController } from "../controllers/listing.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";
import fs from "fs";

const brochureUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), "uploads", "brochures");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post("/listings", isAuthenticated, listingController.create);
router.post("/listings/:id/photos", isAuthenticated, listingController.uploadPhoto);
router.delete("/listings/:id/photos", isAuthenticated, listingController.deletePhoto);
router.put("/listings/:id/amenities", isAuthenticated, listingController.updateAmenities);
router.post("/listings/:listingId/brochure", isAuthenticated, brochureUpload.single("brochure"), listingController.uploadBrochure);

export default router;
