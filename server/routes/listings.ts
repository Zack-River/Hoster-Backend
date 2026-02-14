import { Express } from "express";
import { listingService } from "../services/listing.service";
import { automationService } from "../services/automation.service";
import { isAuthenticated } from "../middleware/auth.middleware";
import { insertListingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

function getUserId(req: any): string {
  return req.session?.userId;
}

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

export function registerListingRoutes(app: Express) {
  app.post("/api/listings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const parsed = insertListingSchema.parse({
        userId,
        name: req.body.name?.trim(),
        status: "ACTIVE",
      });
      // createListing expects Prisma input which matches InsertListing mostly but checking types...
      // listingService.createListing takes Prisma.ListingCreateInput
      // Our InsertListing from schema.ts might have slightly different types (dates vs strings).
      // Zod schema parses to valid types.
      const listing = await listingService.createListing(parsed as any); 
      res.json(listing);
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ error: "Invalid unit data", details: err.errors });
      }
      console.error("Create listing error:", err);
      res.status(500).json({ error: "Failed to create unit" });
    }
  });

  app.post("/api/listings/:id/photos", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const listingId = req.params.id;
      const { image } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ message: "No image data" });
      }
      
      const listing = await listingService.getListingById(listingId as string);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = image.startsWith("data:image/png") ? "png" : "jpg";
      const filename = `listing-${listingId as string}-${Date.now()}.${ext}`;
      const dir = path.join(process.cwd(), "uploads", "listings");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), buffer);
      const photoUrl = `/uploads/listings/${filename}`;

      const currentPhotos = listing.photos || [];
      const updatedPhotos = [...currentPhotos, photoUrl];
      
      await listingService.updateListing(listingId as string, { photos: updatedPhotos });
      res.json({ photos: updatedPhotos, url: photoUrl });
    } catch (error) {
      console.error("Upload listing photo error:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  app.delete("/api/listings/:id/photos", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const listingId = req.params.id;
      const { photoUrl } = req.body;
      
      const listing = await listingService.getListingById(listingId as string);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const updatedPhotos = (listing.photos || []).filter((p: string) => p !== photoUrl);
      await listingService.updateListing(listingId as string, { photos: updatedPhotos });
      res.json({ photos: updatedPhotos });
    } catch (error) {
      console.error("Delete listing photo error:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  });

  app.put("/api/listings/:id/amenities", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const listingId = req.params.id;
      const { amenities } = req.body;
      if (!Array.isArray(amenities)) {
        return res.status(400).json({ message: "Amenities must be an array" });
      }
      
      const listing = await listingService.getListingById(listingId as string);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      await listingService.updateListing(listingId as string, { amenities });
      res.json({ amenities });
    } catch (error) {
      console.error("Update amenities error:", error);
      res.status(500).json({ message: "Failed to update amenities" });
    }
  });

  app.post("/api/listings/:listingId/brochure", isAuthenticated, brochureUpload.single("brochure"), async (req, res) => {
    try {
      const userId = getUserId(req);
      const listing = await listingService.getListingById((req.params.listingId || req.params.id) as string);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `/uploads/brochures/${file.filename}`;
      const existing = await automationService.getListingConfig(listing.id);

      if (existing?.brochurePdfUrl) {
        const oldPath = path.join(process.cwd(), existing.brochurePdfUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await automationService.upsertListingConfig({
        listingId: listing.id,
        defaultCheckinTime: existing?.defaultCheckinTime ?? null,
        doorCodeEncrypted: existing?.doorCodeEncrypted ?? null,
        wifiSsidEncrypted: existing?.wifiSsidEncrypted ?? null,
        wifiPasswordEncrypted: existing?.wifiPasswordEncrypted ?? null,
        brochurePdfUrl: fileUrl,
        brochurePdfFilename: file.originalname,
      });

      res.json({ url: fileUrl, filename: file.originalname });
    } catch (error) {
      console.error("Brochure upload error:", error);
      res.status(500).json({ message: "Failed to upload brochure" });
    }
  });
}
