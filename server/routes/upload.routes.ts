import { Router } from "express";
import { uploadController } from "../controllers/upload.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
import express from "express";
import path from "path";
import fs from "fs";

const router = Router();
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(path.join(uploadsDir, "avatars"))) {
  fs.mkdirSync(path.join(uploadsDir, "avatars"), { recursive: true });
}

// Serve static files
// Note: In original code, this was `app.use("/uploads", ...)` which mounts it at root level.
// Here we are inside a router, likely mounted at `/api` or similar. 
// If we want to serve /uploads, we should probably do it in the main index.ts, not here.
// But for now, I'll leave the controller route. The static serving should be moved to index.ts.

router.post("/upload/avatar", isAuthenticated, uploadController.uploadAvatar);

export default router;
