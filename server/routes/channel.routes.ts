import { Router } from "express";
import { channelController } from "../controllers/channel.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = Router();

router.post("/providers/connect", isAuthenticated, channelController.connect);
router.post("/providers/disconnect", isAuthenticated, channelController.disconnect);
router.post("/sync/run", isAuthenticated, channelController.runSync);
router.post("/sync/channel", isAuthenticated, channelController.syncChannel);
router.delete("/channels/:channelKey/data", isAuthenticated, channelController.deleteData);
router.post("/sync/import-listings", isAuthenticated, channelController.importListings);

router.get("/dev-portal/configs", isAuthenticated, channelController.getConfigs);
router.put("/dev-portal/configs", isAuthenticated, channelController.upsertConfig);
router.delete("/dev-portal/configs/:id", isAuthenticated, channelController.deleteConfig);
router.post("/dev-portal/test-connection", isAuthenticated, channelController.testConnection);
router.get("/dev-portal/logs", isAuthenticated, channelController.getLogs);

export default router;
