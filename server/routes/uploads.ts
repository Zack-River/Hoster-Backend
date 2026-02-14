import { Express } from "express";
import { isAuthenticated } from "../middleware/auth.middleware";
import { userService } from "../services/user.service";
import path from "path";
import fs from "fs";
import express from "express";

function getUserId(req: any): string {
  return req.session?.userId;
}

export function registerUploadRoutes(app: Express) {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(path.join(uploadsDir, "avatars"))) {
    fs.mkdirSync(path.join(uploadsDir, "avatars"), { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  app.post("/api/upload/avatar", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { image } = req.body;
      if (!image || typeof image !== "string") {
        return res.status(400).json({ message: "No image data" });
      }
      const matches = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ message: "Invalid image format. Only PNG, JPEG, and WebP allowed." });
      }
      const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
      const buffer = Buffer.from(matches[2], "base64");
      const MAX_SIZE = 4 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        return res.status(400).json({ message: "Image must be under 4MB" });
      }
      const filename = `${userId}.${ext}`;
      const filepath = path.join(uploadsDir, "avatars", filename);
      fs.writeFileSync(filepath, buffer);
      const url = `/uploads/avatars/${filename}?t=${Date.now()}`;
      
      await userService.updateUser(userId, { profileImageUrl: url });
      res.json({ url });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  });
}
