import { Express } from "express";
import { registerDashboardRoutes } from "./dashboard";
import { registerReservationRoutes } from "./reservations";
import { registerCalendarRoutes } from "./calendar";
import { registerMessageRoutes } from "./messages";
import { registerListingRoutes } from "./listings";
import { registerChannelRoutes } from "./channels";
import { registerAutomationRoutes } from "./automation";
import { registerNotificationRoutes } from "./notifications";
import { registerUploadRoutes } from "./uploads";
import adminRoutes from "./admin.routes";
import providerRoutes from "./provider.routes";
import cleaningRoutes from "./cleaning.routes";

export function registerAppRoutes(app: Express) {
  registerDashboardRoutes(app);
  registerReservationRoutes(app);
  registerCalendarRoutes(app);
  registerMessageRoutes(app);
  registerListingRoutes(app);
  registerChannelRoutes(app);
  registerAutomationRoutes(app);
  registerNotificationRoutes(app);
  registerUploadRoutes(app);
  
  // Register new modules
  app.use("/api", adminRoutes);
  app.use("/api", providerRoutes);
  app.use("/api", cleaningRoutes);
}
