import { Request, Response } from "express";
import { userService } from "../services/user.service";
import path from "path";
import fs from "fs";

export class UploadController {
  async uploadAvatar(req: Request, res: Response) {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(path.join(uploadsDir, "avatars"))) {
      fs.mkdirSync(path.join(uploadsDir, "avatars"), { recursive: true });
    }

    try {
      const userId = (req.session as any).userId;
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
      
      // Update user profile using userService (assuming it has updateUser or expose a way to do it)
      // Since userService might not have updateUser exposed, we can use db directly or add it.
      // Checking userService definition... it usually has generic update or specific.
      // If userService doesn't have it, I'll use userService.updateUser if added, or db.
      await userService.updateUser(userId, { profileImageUrl: url });

      res.json({ url });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Upload failed" });
    }
  }
}

export const uploadController = new UploadController();
