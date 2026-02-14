import express from "express";
import path from "path";
import { createServer } from "http";
import compression from "compression";
import { Logger, stream } from "./utils/logger";
import authRoutes from "./routes/auth.routes";
import { registerAppRoutes } from "./routes/index"; // Uses the new routes aggregator
import { setupSession } from "./config/session"; // Uses the extracted session config
import morgan from "morgan";
const app = express();
// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());
// Uploads - Static serving
const uploadsDir = path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));
// Morgan middleware to log HTTP requests
app.use(morgan(":method :url :status :res[content-length] - :response-time ms", { stream }));
(async () => {
    const server = createServer(app);
    // Setup session
    setupSession(app);
    // Setup Auth
    // Register Routes
    app.use("/api", authRoutes);
    registerAppRoutes(app);
    // Global Error Handler
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        Logger.error(err.message || err);
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
        Logger.info(`serving on port ${PORT}`);
    });
})();
