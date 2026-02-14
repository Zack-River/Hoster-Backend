import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { createServer } from "http";
import compression from "compression";
import { setupVite, serveStatic, log } from "./vite";
import authRoutes from "./routes/auth.routes";
import { registerAppRoutes } from "./routes/index"; // Uses the new routes aggregator
import { setupSession } from "./config/session"; // Uses the extracted session config

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());

// Uploads - Static serving
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = createServer(app);

  // Setup session
  setupSession(app);

  // Setup Auth
  
  // Register Routes
  app.use("/api", authRoutes);
  registerAppRoutes(app);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error(err);
  });

  // Setup Vite/Static serving
  // Setup Vite/Static serving
  // if (app.get("env") === "development") {
  //   await setupVite(server, app);
  // } else {
  //   serveStatic(app);
  // }

  // Start Server
  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();
