import { Request, Response } from "express";
import { listingService } from "../services/listing.service";
import { automationService } from "../services/automation.service";
import { z } from "zod";
import path from "path";
import fs from "fs";

export class ListingController {
  async create(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const schema = z.object({
        name: z.string().min(1),
      });
      const { name } = schema.parse(req.body);

      const listing = await listingService.createListing({
        user: { connect: { id: userId } },
        name: name.trim(),
        status: "ACTIVE",
      });
      res.json(listing);
    } catch (err: any) {
      if (err?.name === "ZodError") {
        return res.status(400).json({ error: "Invalid unit data", details: err.errors });
      }
      console.error("Create listing error:", err);
      res.status(500).json({ error: "Failed to create unit" });
    }
  }

  async uploadPhoto(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const listingId = String(req.params.id);
      const { image } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ message: "No image data" });
      }
      const listing = await listingService.getListingById(listingId);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = image.startsWith("data:image/png") ? "png" : "jpg";
      const filename = `listing-${listingId}-${Date.now()}.${ext}`;
      const dir = path.join(process.cwd(), "uploads", "listings");
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), buffer);
      const photoUrl = `/uploads/listings/${filename}`;

      const currentPhotos = listing.photos || [];
      const updatedPhotos = [...currentPhotos, photoUrl];
      
      await listingService.updateListing(listingId, { photos: updatedPhotos });
      res.json({ photos: updatedPhotos, url: photoUrl });
    } catch (error) {
      console.error("Upload listing photo error:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  }

  async deletePhoto(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const listingId = String(req.params.id);
      const { photoUrl } = req.body;
      const listing = await listingService.getListingById(listingId);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      const updatedPhotos = (listing.photos || []).filter((p: any) => p !== photoUrl);
      await listingService.updateListing(listingId, { photos: updatedPhotos });
      res.json({ photos: updatedPhotos });
    } catch (error) {
      console.error("Delete listing photo error:", error);
      res.status(500).json({ message: "Failed to delete photo" });
    }
  }

  async updateAmenities(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const listingId = String(req.params.id);
      const { amenities } = req.body;
      if (!Array.isArray(amenities)) {
        return res.status(400).json({ message: "Amenities must be an array" });
      }
      const listing = await listingService.getListingById(listingId);
      if (!listing || listing.userId !== userId) {
        return res.status(404).json({ message: "Listing not found" });
      }

      await listingService.updateListing(listingId, { amenities });
      res.json({ amenities });
    } catch (error) {
      console.error("Update amenities error:", error);
      res.status(500).json({ message: "Failed to update amenities" });
    }
  }

  async uploadBrochure(req: Request, res: Response) {
    try {
      const userId = (req.session as any).userId;
      const listing = await listingService.getListingById(req.params.listingId as string);
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
        // if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await automationService.upsertListingConfig({
        listingId: listing.id,
        defaultCheckinTime: existing?.defaultCheckinTime ?? null,
        doorCodeEncrypted: existing?.doorCodeEncrypted ?? null,
        wifiSsidEncrypted: existing?.wifiSsidEncrypted ?? null,
        wifiPasswordEncrypted: existing?.wifiPasswordEncrypted ?? null,
        brochurePdfUrl: fileUrl,
        brochurePdfFilename: file.originalname,
      } as any);

      res.json({ url: fileUrl, filename: file.originalname });
    } catch (error) {
      console.error("Brochure upload error:", error);
      res.status(500).json({ message: "Failed to upload brochure" });
    }
  }
}

export const listingController = new ListingController();
