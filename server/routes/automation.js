import { automationService } from "../services/automation.service";
import { messageService } from "../services/message.service";
import { notificationService } from "../services/notification.service";
import { listingService } from "../services/listing.service";
import { reservationService } from "../services/reservation.service";
import { channelService } from "../services/channel.service";
import { templateService } from "../services/template.service";
import { isAuthenticated } from "../middleware/auth.middleware";
import { z } from "zod";
import { format, addDays, subDays } from "date-fns";
import { encrypt, decrypt } from "../encryption";
import { canSendAutomatedMessage, quietHoursCheck, templateRender, buildDedupeKey, isDuplicate, checkAccessDataMissing } from "../automation";
function getUserId(req) {
    return req.session?.userId;
}
export function registerAutomationRoutes(app) {
    // Messages automation logic helper (internal to this module or imported if needed elsewhere)
    async function executeCheckinAutomation(userId, reservation, actionType, templateKey, listingConfig, autoSettings, connections) {
        const dedupeKey = buildDedupeKey(actionType, reservation.id);
        const canSend = await canSendAutomatedMessage(userId, reservation.listingId, reservation.channelId);
        if (!canSend.ok) {
            await automationService.createActionLog({
                userId,
                listingId: reservation.listingId,
                reservationId: reservation.id,
                channelId: reservation.channelId,
                actionType,
                status: "PAUSED",
                reason: canSend.reason || "Cannot send",
                guestName: reservation.guestName,
                listingName: reservation.listing?.name || "",
                channelKey: reservation.channel?.key || null,
                dedupeKey,
            });
            return;
        }
        if (actionType === "SEND_WELCOME_10MIN" && autoSettings?.welcomeIncludePdf && !listingConfig?.brochurePdfUrl) {
            await automationService.createActionLog({
                userId,
                listingId: reservation.listingId,
                reservationId: reservation.id,
                channelId: reservation.channelId,
                actionType,
                status: "PAUSED",
                reason: "MISSING_PDF",
                guestName: reservation.guestName,
                listingName: reservation.listing?.name || "",
                channelKey: reservation.channel?.key || null,
                dedupeKey,
            });
            await notificationService.createNotification({
                userId,
                type: "AUTOMATION_PAUSED",
                title: "Welcome message paused",
                body: `Welcome message for ${reservation.guestName} paused: PDF brochure enabled but no file uploaded for ${reservation.listing?.name || "listing"}`,
                entityType: "reservation",
                entityId: reservation.id,
            });
            return;
        }
        const template = await automationService.getTemplateByKey(userId, templateKey);
        if (!template)
            return;
        let brochureLink = "";
        if (listingConfig?.brochurePdfUrl && autoSettings?.welcomeIncludePdf) {
            brochureLink = `House Guide: ${listingConfig.brochurePdfUrl}`;
        }
        const renderedBody = templateRender(template.body, {
            GuestName: reservation.guestName,
            ListingName: reservation.listing?.name || "",
            CheckInDate: format(reservation.checkIn, "yyyy-MM-dd"),
            CheckOutDate: format(reservation.checkOut, "yyyy-MM-dd"),
            CheckInTime: listingConfig?.defaultCheckinTime || "15:00",
            DoorCode: listingConfig?.doorCodeEncrypted ? decrypt(listingConfig.doorCodeEncrypted) : "",
            WifiName: listingConfig?.wifiSsidEncrypted ? decrypt(listingConfig.wifiSsidEncrypted) : "",
            WifiPassword: listingConfig?.wifiPasswordEncrypted ? decrypt(listingConfig.wifiPasswordEncrypted) : "",
            BrochureLink: brochureLink,
        });
        try {
            const convos = await messageService.getConversations(userId);
            const conv = convos.find(c => c.reservation?.id === reservation.id);
            let messageId;
            if (conv) {
                const msg = await messageService.createMessage({
                    conversationId: conv.id,
                    direction: "OUTBOUND",
                    body: renderedBody,
                });
                messageId = msg.id;
            }
            await automationService.createActionLog({
                userId,
                listingId: reservation.listingId,
                reservationId: reservation.id,
                channelId: reservation.channelId,
                actionType,
                status: "SUCCESS",
                messageId: messageId || null,
                guestName: reservation.guestName,
                listingName: reservation.listing?.name || "",
                channelKey: reservation.channel?.key || null,
                dedupeKey,
            });
        }
        catch (error) {
            await automationService.createActionLog({
                userId,
                listingId: reservation.listingId,
                reservationId: reservation.id,
                channelId: reservation.channelId,
                actionType,
                status: "FAILED",
                reason: `SEND_FAILED: ${error.message}`,
                guestName: reservation.guestName,
                listingName: reservation.listing?.name || "",
                channelKey: reservation.channel?.key || null,
                dedupeKey,
            });
            await notificationService.createNotification({
                userId,
                type: "AUTOMATION_FAILED",
                title: `${templateKey} failed`,
                body: `Failed to send ${templateKey} for ${reservation.guestName}: ${error.message}`,
                entityType: "reservation",
                entityId: reservation.id,
            });
        }
    }
    app.get("/api/automation/checkin", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            await automationService.seedTemplates(userId);
            const [settings, templates, listingConfigs, connections] = await Promise.all([
                automationService.getSettings(userId),
                automationService.getTemplates(userId),
                automationService.getListingConfigsByUser(userId),
                channelService.getConnections(userId),
            ]);
            const checkinTemplates = templates.filter(t => ["WELCOME_10MIN", "ACCESS_30MIN", "FOLLOWUP_1H"].includes(t.key));
            const warnings = [];
            for (const cfg of listingConfigs) {
                if (!cfg.defaultCheckinTime) {
                    warnings.push({ listingId: cfg.listingId, listingName: cfg.listingName, field: "defaultCheckinTime", message: "Missing default check-in time" });
                }
                if (!cfg.doorCodeEncrypted) {
                    warnings.push({ listingId: cfg.listingId, listingName: cfg.listingName, field: "doorCode", message: "Missing door code" });
                }
                if (!cfg.wifiSsidEncrypted) {
                    warnings.push({ listingId: cfg.listingId, listingName: cfg.listingName, field: "wifiSsid", message: "Missing Wi-Fi network name" });
                }
                if (!cfg.wifiPasswordEncrypted) {
                    warnings.push({ listingId: cfg.listingId, listingName: cfg.listingName, field: "wifiPassword", message: "Missing Wi-Fi password" });
                }
                if (settings?.welcomeIncludePdf && !cfg.brochurePdfUrl) {
                    warnings.push({ listingId: cfg.listingId, listingName: cfg.listingName, field: "brochurePdf", message: "PDF brochure enabled but no file uploaded" });
                }
            }
            res.json({
                settings: {
                    welcomeEnabled: settings?.welcomeEnabled ?? true,
                    welcomeIncludePdf: settings?.welcomeIncludePdf ?? false,
                    accessEnabled: settings?.accessEnabled ?? true,
                    followupEnabled: settings?.followupEnabled ?? true,
                },
                templates: checkinTemplates.map(t => ({
                    id: t.id,
                    key: t.key,
                    name: t.name,
                    body: t.body,
                })),
                listingConfigs: listingConfigs.map(cfg => ({
                    listingId: cfg.listingId,
                    listingName: cfg.listingName,
                    defaultCheckinTime: cfg.defaultCheckinTime || "",
                    hasDoorCode: !!cfg.doorCodeEncrypted,
                    hasWifiSsid: !!cfg.wifiSsidEncrypted,
                    hasWifiPassword: !!cfg.wifiPasswordEncrypted,
                    brochurePdfUrl: cfg.brochurePdfUrl || null,
                    brochurePdfFilename: cfg.brochurePdfFilename || null,
                })),
                warnings,
            });
        }
        catch (error) {
            console.error("Get checkin automation error:", error);
            res.status(500).json({ message: "Failed to load check-in automation" });
        }
    });
    app.put("/api/automation/checkin/settings", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const schema = z.object({
                welcomeEnabled: z.boolean().optional(),
                welcomeIncludePdf: z.boolean().optional(),
                accessEnabled: z.boolean().optional(),
                followupEnabled: z.boolean().optional(),
            });
            const updates = schema.parse(req.body);
            const existing = await automationService.getSettings(userId);
            const merged = {
                userId,
                autoCheckinEnabled: existing?.autoCheckinEnabled ?? true,
                autoCheckinTiming: existing?.autoCheckinTiming ?? "CHECKIN_MINUS_24H",
                autoCheckoutThanksEnabled: existing?.autoCheckoutThanksEnabled ?? true,
                cleaningReminderEnabled: existing?.cleaningReminderEnabled ?? false,
                autoFirstReplyEnabled: existing?.autoFirstReplyEnabled ?? false,
                quietHoursEnabled: existing?.quietHoursEnabled ?? false,
                quietHoursStart: existing?.quietHoursStart ?? "23:00",
                quietHoursEnd: existing?.quietHoursEnd ?? "08:00",
                welcomeEnabled: updates.welcomeEnabled ?? existing?.welcomeEnabled ?? true,
                welcomeIncludePdf: updates.welcomeIncludePdf ?? existing?.welcomeIncludePdf ?? false,
                accessEnabled: updates.accessEnabled ?? existing?.accessEnabled ?? true,
                followupEnabled: updates.followupEnabled ?? existing?.followupEnabled ?? true,
            };
            await automationService.upsertSettings(merged);
            res.json({ success: true });
        }
        catch (error) {
            console.error("Update checkin settings error:", error);
            res.status(500).json({ message: "Failed to update check-in settings" });
        }
    });
    app.put("/api/automation/checkin/templates/:key", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const key = req.params.key;
            const validKeys = ["WELCOME_10MIN", "ACCESS_30MIN", "FOLLOWUP_1H"];
            if (!validKeys.includes(key)) {
                return res.status(400).json({ message: "Invalid template key" });
            }
            const schema = z.object({
                body: z.string().min(1),
            });
            const data = schema.parse(req.body);
            const existing = await automationService.getTemplateByKey(userId, key);
            await automationService.upsertTemplate({
                userId,
                key: key,
                name: existing?.name || key,
                body: data.body,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Update checkin template error:", error);
            res.status(500).json({ message: "Failed to update template" });
        }
    });
    app.put("/api/listings/automation/apply-all", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const userListings = await listingService.getListings(userId);
            if (!userListings.length) {
                return res.status(404).json({ message: "No listings found" });
            }
            const schema = z.object({
                defaultCheckinTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
                doorCode: z.string().optional().nullable(),
                wifiSsid: z.string().optional().nullable(),
                wifiPassword: z.string().optional().nullable(),
            });
            const data = schema.parse(req.body);
            for (const listing of userListings) {
                const existing = await automationService.getListingConfig(listing.id);
                await automationService.upsertListingConfig({
                    listingId: listing.id,
                    defaultCheckinTime: data.defaultCheckinTime ?? existing?.defaultCheckinTime ?? null,
                    doorCodeEncrypted: data.doorCode ? encrypt(data.doorCode) : (data.doorCode === "" ? null : existing?.doorCodeEncrypted ?? null),
                    wifiSsidEncrypted: data.wifiSsid ? encrypt(data.wifiSsid) : (data.wifiSsid === "" ? null : existing?.wifiSsidEncrypted ?? null),
                    wifiPasswordEncrypted: data.wifiPassword ? encrypt(data.wifiPassword) : (data.wifiPassword === "" ? null : existing?.wifiPasswordEncrypted ?? null),
                    brochurePdfUrl: existing?.brochurePdfUrl ?? null,
                    brochurePdfFilename: existing?.brochurePdfFilename ?? null,
                });
            }
            res.json({ success: true, updatedCount: userListings.length });
        }
        catch (error) {
            console.error("Apply all listing automation config error:", error);
            res.status(500).json({ message: "Failed to apply config to all listings" });
        }
    });
    app.get("/api/listings/:listingId/automation", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const listing = await listingService.getListingById(req.params.listingId);
            if (!listing || listing.userId !== userId) {
                return res.status(404).json({ message: "Listing not found" });
            }
            const config = await automationService.getListingConfig(listing.id);
            res.json({
                listingId: listing.id,
                listingName: listing.name,
                defaultCheckinTime: config?.defaultCheckinTime || "",
                doorCode: config?.doorCodeEncrypted ? decrypt(config.doorCodeEncrypted) : "",
                wifiSsid: config?.wifiSsidEncrypted ? decrypt(config.wifiSsidEncrypted) : "",
                wifiPassword: config?.wifiPasswordEncrypted ? decrypt(config.wifiPasswordEncrypted) : "",
                brochurePdfUrl: config?.brochurePdfUrl || null,
                brochurePdfFilename: config?.brochurePdfFilename || null,
            });
        }
        catch (error) {
            console.error("Get listing automation config error:", error);
            res.status(500).json({ message: "Failed to load listing config" });
        }
    });
    app.put("/api/listings/:listingId/automation", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const listing = await listingService.getListingById(req.params.listingId);
            if (!listing || listing.userId !== userId) {
                return res.status(404).json({ message: "Listing not found" });
            }
            const schema = z.object({
                defaultCheckinTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
                doorCode: z.string().optional().nullable(),
                wifiSsid: z.string().optional().nullable(),
                wifiPassword: z.string().optional().nullable(),
            });
            const data = schema.parse(req.body);
            const existing = await automationService.getListingConfig(listing.id);
            await automationService.upsertListingConfig({
                listingId: listing.id,
                defaultCheckinTime: data.defaultCheckinTime ?? existing?.defaultCheckinTime ?? null,
                doorCodeEncrypted: data.doorCode ? encrypt(data.doorCode) : (data.doorCode === "" ? null : existing?.doorCodeEncrypted ?? null),
                wifiSsidEncrypted: data.wifiSsid ? encrypt(data.wifiSsid) : (data.wifiSsid === "" ? null : existing?.wifiSsidEncrypted ?? null),
                wifiPasswordEncrypted: data.wifiPassword ? encrypt(data.wifiPassword) : (data.wifiPassword === "" ? null : existing?.wifiPasswordEncrypted ?? null),
                brochurePdfUrl: existing?.brochurePdfUrl ?? null,
                brochurePdfFilename: existing?.brochurePdfFilename ?? null,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Update listing automation config error:", error);
            res.status(500).json({ message: "Failed to update listing config" });
        }
    });
    app.post("/api/cron/daily", async (req, res) => {
        const cronSecret = req.headers["x-cron-secret"];
        if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        try {
            const now = new Date();
            const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
            const today = format(now, "yyyy-MM-dd");
            const yesterday = format(subDays(now, 1), "yyyy-MM-dd");
            const allUserIds = await automationService.getAllUserIds();
            for (const userId of allUserIds) {
                const autoSettings = await automationService.getSettings(userId);
                const connections = await channelService.getConnections(userId);
                if (connections.length === 0)
                    continue;
                const isQuietHours = autoSettings
                    ? quietHoursCheck(now, autoSettings.quietHoursEnabled, autoSettings.quietHoursStart, autoSettings.quietHoursEnd)
                    : false;
                if (autoSettings?.autoCheckinEnabled !== false) {
                    const timing = autoSettings?.autoCheckinTiming || "CHECKIN_MINUS_24H";
                    const targetDate = timing === "CHECKIN_MINUS_24H" ? tomorrow : today;
                    if (timing === "CHECKIN_MORNING" && now.getHours() < 8) {
                        // skip until 8 AM
                    }
                    else {
                        const checkIns = await reservationService.getReservationsByCheckIn(targetDate);
                        const userCheckIns = checkIns.filter(r => r.listing.userId === userId && r.status === "CONFIRMED");
                        for (const reservation of userCheckIns) {
                            if (isQuietHours) {
                                await automationService.createActionLog({
                                    userId,
                                    listingId: reservation.listingId,
                                    reservationId: reservation.id,
                                    channelId: reservation.channelId,
                                    actionType: "SEND_CHECKIN_MESSAGE",
                                    status: "PAUSED",
                                    reason: "QUIET_HOURS",
                                    guestName: reservation.guestName,
                                    listingName: reservation.listing.name,
                                    channelKey: reservation.channel?.key || null,
                                });
                                continue;
                            }
                            const canSend = await canSendAutomatedMessage(userId, reservation.listingId, reservation.channelId);
                            if (!canSend.ok) {
                                await automationService.createActionLog({
                                    userId,
                                    listingId: reservation.listingId,
                                    reservationId: reservation.id,
                                    channelId: reservation.channelId,
                                    actionType: "SEND_CHECKIN_MESSAGE",
                                    status: "PAUSED",
                                    reason: canSend.reason || "Cannot send",
                                    guestName: reservation.guestName,
                                    listingName: reservation.listing.name,
                                    channelKey: reservation.channel?.key || null,
                                });
                                continue;
                            }
                            const template = await automationService.getTemplateByKey(userId, "CHECKIN_MESSAGE");
                            if (template) {
                                const renderedBody = templateRender(template.body, {
                                    GuestName: reservation.guestName,
                                    ListingName: reservation.listing.name,
                                    CheckInDate: format(reservation.checkIn, "yyyy-MM-dd"),
                                    CheckOutDate: format(reservation.checkOut, "yyyy-MM-dd"),
                                });
                                const convos = await messageService.getConversations(userId);
                                const conv = convos.find(c => c.reservation?.id === reservation.id);
                                if (conv) {
                                    const msg = await messageService.createMessage({
                                        conversationId: conv.id,
                                        direction: "OUTBOUND",
                                        body: renderedBody,
                                    });
                                    await automationService.createActionLog({
                                        userId,
                                        listingId: reservation.listingId,
                                        reservationId: reservation.id,
                                        channelId: reservation.channelId,
                                        actionType: "SEND_CHECKIN_MESSAGE",
                                        status: "SUCCESS",
                                        messageId: msg.id,
                                        guestName: reservation.guestName,
                                        listingName: reservation.listing.name,
                                        channelKey: reservation.channel?.key || null,
                                    });
                                }
                                else {
                                    await automationService.createActionLog({
                                        userId,
                                        listingId: reservation.listingId,
                                        reservationId: reservation.id,
                                        channelId: reservation.channelId,
                                        actionType: "SEND_CHECKIN_MESSAGE",
                                        status: "SUCCESS",
                                        guestName: reservation.guestName,
                                        listingName: reservation.listing.name,
                                        channelKey: reservation.channel?.key || null,
                                    });
                                }
                            }
                            await notificationService.createNotification({
                                userId,
                                type: "CHECKIN_REMINDER",
                                title: "Check-in reminder",
                                body: `${reservation.guestName} is checking in ${timing === "CHECKIN_MINUS_24H" ? "tomorrow" : "today"} at ${reservation.listing.name}`,
                                entityType: "reservation",
                                entityId: reservation.id,
                            });
                        }
                    }
                }
                if (autoSettings?.autoCheckoutThanksEnabled !== false) {
                    const yesterdayCheckOuts = await reservationService.getReservationsByCheckOut(yesterday);
                    const userYesterdayOuts = yesterdayCheckOuts.filter(r => r.listing.userId === userId);
                    for (const reservation of userYesterdayOuts) {
                        if (isQuietHours) {
                            await automationService.createActionLog({
                                userId,
                                listingId: reservation.listingId,
                                reservationId: reservation.id,
                                channelId: reservation.channelId,
                                actionType: "SEND_CHECKOUT_THANKYOU",
                                status: "PAUSED",
                                reason: "QUIET_HOURS",
                                guestName: reservation.guestName,
                                listingName: reservation.listing.name,
                                channelKey: reservation.channel?.key || null,
                            });
                            continue;
                        }
                        const canSend = await canSendAutomatedMessage(userId, reservation.listingId, reservation.channelId);
                        if (!canSend.ok) {
                            await automationService.createActionLog({
                                userId,
                                listingId: reservation.listingId,
                                reservationId: reservation.id,
                                channelId: reservation.channelId,
                                actionType: "SEND_CHECKOUT_THANKYOU",
                                status: "PAUSED",
                                reason: canSend.reason || "Cannot send",
                                guestName: reservation.guestName,
                                listingName: reservation.listing.name,
                                channelKey: reservation.channel?.key || null,
                            });
                            continue;
                        }
                        const template = await automationService.getTemplateByKey(userId, "CHECKOUT_THANKYOU");
                        if (template) {
                            const renderedBody = templateRender(template.body, {
                                GuestName: reservation.guestName,
                                ListingName: reservation.listing.name,
                                CheckInDate: format(reservation.checkIn, "yyyy-MM-dd"),
                                CheckOutDate: format(reservation.checkOut, "yyyy-MM-dd"),
                            });
                            const convos = await messageService.getConversations(userId);
                            const conv = convos.find(c => c.reservation?.id === reservation.id);
                            if (conv) {
                                const msg = await messageService.createMessage({
                                    conversationId: conv.id,
                                    direction: "OUTBOUND",
                                    body: renderedBody,
                                });
                                await automationService.createActionLog({
                                    userId,
                                    listingId: reservation.listingId,
                                    reservationId: reservation.id,
                                    channelId: reservation.channelId,
                                    actionType: "SEND_CHECKOUT_THANKYOU",
                                    status: "SUCCESS",
                                    messageId: msg.id,
                                    guestName: reservation.guestName,
                                    listingName: reservation.listing.name,
                                    channelKey: reservation.channel?.key || null,
                                });
                            }
                        }
                    }
                }
                if (autoSettings?.cleaningReminderEnabled) {
                    const todayCheckOuts = await reservationService.getReservationsByCheckOut(today);
                    const userTodayOuts = todayCheckOuts.filter(r => r.listing.userId === userId);
                    for (const reservation of userTodayOuts) {
                        await notificationService.createNotification({
                            userId,
                            type: "CLEANING_REMINDER",
                            title: "Cleaning needed",
                            body: `${reservation.guestName} checks out today from ${reservation.listing.name}. Schedule cleaning.`,
                            entityType: "reservation",
                            entityId: reservation.id,
                        });
                        await automationService.createActionLog({
                            userId,
                            listingId: reservation.listingId,
                            reservationId: reservation.id,
                            channelId: reservation.channelId,
                            actionType: "CLEANING_REMINDER",
                            status: "SUCCESS",
                            guestName: reservation.guestName,
                            listingName: reservation.listing.name,
                            channelKey: reservation.channel?.key || null,
                        });
                    }
                }
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error("Cron error:", error);
            res.status(500).json({ message: "Cron job failed" });
        }
    });
    app.post("/api/cron/every10min", async (req, res) => {
        const cronSecret = req.headers["x-cron-secret"];
        if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        try {
            const now = new Date();
            const allUserIds = await automationService.getAllUserIds();
            for (const userId of allUserIds) {
                const autoSettings = await automationService.getSettings(userId);
                const connections = await channelService.getConnections(userId);
                if (connections.length === 0)
                    continue;
                const allReservations = await reservationService.getReservationsByUser(userId);
                const confirmed = allReservations.filter(r => r.status === "CONFIRMED");
                for (const reservation of confirmed) {
                    const listingConfig = await automationService.getListingConfig(reservation.listingId);
                    // 1) Welcome message: 10 min after booking
                    if (autoSettings?.welcomeEnabled !== false) {
                        const dedupeKey = buildDedupeKey("SEND_WELCOME_10MIN", reservation.id);
                        const already = await isDuplicate(dedupeKey);
                        if (!already) {
                            const createdAt = reservation.updatedAt;
                            if (createdAt) {
                                const tenMinAfter = new Date(createdAt.getTime() + 10 * 60 * 1000);
                                const twentyMinAfter = new Date(createdAt.getTime() + 20 * 60 * 1000);
                                if (now >= tenMinAfter && now <= twentyMinAfter) {
                                    await executeCheckinAutomation(userId, reservation, "SEND_WELCOME_10MIN", "WELCOME_10MIN", listingConfig, autoSettings, connections);
                                }
                            }
                        }
                    }
                    // 2) Access message: 30 min before check-in
                    if (autoSettings?.accessEnabled !== false) {
                        const dedupeKey = buildDedupeKey("SEND_ACCESS_30MIN", reservation.id);
                        const already = await isDuplicate(dedupeKey);
                        if (!already) {
                            const checkinTime = listingConfig?.defaultCheckinTime || "15:00";
                            const checkinDateTime = new Date(`${reservation.checkIn}T${checkinTime}:00`);
                            const thirtyMinBefore = new Date(checkinDateTime.getTime() - 30 * 60 * 1000);
                            const windowEnd = new Date(checkinDateTime.getTime());
                            if (now >= thirtyMinBefore && now <= windowEnd) {
                                const missingFields = checkAccessDataMissing(listingConfig || {});
                                if (missingFields.length > 0) {
                                    await automationService.createActionLog({
                                        userId,
                                        listingId: reservation.listingId,
                                        reservationId: reservation.id,
                                        channelId: reservation.channelId,
                                        actionType: "SEND_ACCESS_30MIN",
                                        status: "PAUSED",
                                        reason: missingFields[0],
                                        guestName: reservation.guestName,
                                        listingName: reservation.listing.name,
                                        channelKey: reservation.channel?.key || null,
                                        dedupeKey,
                                    });
                                    await notificationService.createNotification({
                                        userId,
                                        type: "AUTOMATION_PAUSED",
                                        title: "Access message paused",
                                        body: `Access message for ${reservation.guestName} at ${reservation.listing.name} paused: ${missingFields.join(", ")}`,
                                        entityType: "reservation",
                                        entityId: reservation.id,
                                    });
                                }
                                else {
                                    await executeCheckinAutomation(userId, reservation, "SEND_ACCESS_30MIN", "ACCESS_30MIN", listingConfig, autoSettings, connections);
                                }
                            }
                        }
                    }
                    // 3) Follow-up message: 1 hour after check-in
                    if (autoSettings?.followupEnabled !== false) {
                        const dedupeKey = buildDedupeKey("SEND_FOLLOWUP_1H", reservation.id);
                        const already = await isDuplicate(dedupeKey);
                        if (!already) {
                            const checkinTime = listingConfig?.defaultCheckinTime || "15:00";
                            const checkinDateTime = new Date(`${reservation.checkIn}T${checkinTime}:00`);
                            const oneHourAfter = new Date(checkinDateTime.getTime() + 60 * 60 * 1000);
                            const windowEnd = new Date(oneHourAfter.getTime() + 10 * 60 * 1000);
                            if (now >= oneHourAfter && now <= windowEnd) {
                                await executeCheckinAutomation(userId, reservation, "SEND_FOLLOWUP_1H", "FOLLOWUP_1H", listingConfig, autoSettings, connections);
                            }
                        }
                    }
                }
            }
            res.json({ success: true });
        }
        catch (error) {
            console.error("Cron every10min error:", error);
            res.status(500).json({ message: "Cron job failed" });
        }
    });
    app.post("/api/templates", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const schema = z.object({
                name: z.string().min(1),
                body: z.string().min(1),
            });
            const data = schema.parse(req.body);
            const template = await templateService.createTemplate({ userId, ...data });
            res.json(template);
        }
        catch (error) {
            console.error("Create template error:", error);
            res.status(500).json({ message: "Failed to create template" });
        }
    });
    app.patch("/api/templates/:id", isAuthenticated, async (req, res) => {
        try {
            const schema = z.object({
                name: z.string().min(1),
                body: z.string().min(1),
            });
            const updates = schema.parse(req.body);
            await templateService.updateTemplate(req.params.id, updates);
            res.json({ success: true });
        }
        catch (error) {
            console.error("Update template error:", error);
            res.status(500).json({ message: "Failed to update template" });
        }
    });
    app.delete("/api/templates/:id", isAuthenticated, async (req, res) => {
        try {
            await templateService.deleteTemplate(req.params.id);
            res.json({ success: true });
        }
        catch (error) {
            console.error("Delete template error:", error);
            res.status(500).json({ message: "Failed to delete template" });
        }
    });
    app.patch("/api/reminder-settings", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const schema = z.object({
                autoCheckinMessage: z.boolean().optional(),
                cleaningReminder: z.boolean().optional(),
                checkoutReminder: z.boolean().optional(),
                paymentReminder: z.boolean().optional(),
                reviewReminder: z.boolean().optional(),
                enabled: z.boolean().optional(),
            });
            const updates = schema.parse(req.body);
            const existing = await notificationService.getReminderSettings(userId);
            await notificationService.upsertReminderSettings({
                userId,
                autoCheckinMessage: updates.autoCheckinMessage ?? existing?.autoCheckinMessage ?? false,
                cleaningReminder: updates.cleaningReminder ?? existing?.cleaningReminder ?? false,
                checkoutReminder: updates.checkoutReminder ?? existing?.checkoutReminder ?? false,
                paymentReminder: updates.paymentReminder ?? existing?.paymentReminder ?? false,
                reviewReminder: updates.reviewReminder ?? existing?.reviewReminder ?? false,
                enabled: updates.enabled ?? existing?.enabled ?? true,
            });
            res.json({ success: true });
        }
        catch (error) {
            console.error("Reminder settings error:", error);
            res.status(500).json({ message: "Failed to update settings" });
        }
    });
    app.put("/api/automation/settings", isAuthenticated, async (req, res) => {
        try {
            const userId = getUserId(req);
            const schema = z.object({
                autoCheckinEnabled: z.boolean().optional(),
                autoCheckinTiming: z.enum(["CHECKIN_MINUS_24H", "CHECKIN_MORNING"]).optional(),
                autoCheckoutThanksEnabled: z.boolean().optional(),
                cleaningReminderEnabled: z.boolean().optional(),
                autoFirstReplyEnabled: z.boolean().optional(),
                quietHoursEnabled: z.boolean().optional(),
                quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
                quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
            });
            const updates = schema.parse(req.body);
            const existing = await automationService.getSettings(userId);
            const merged = {
                userId,
                autoCheckinEnabled: updates.autoCheckinEnabled ?? existing?.autoCheckinEnabled ?? true,
                autoCheckinTiming: updates.autoCheckinTiming ?? existing?.autoCheckinTiming ?? "CHECKIN_MINUS_24H",
                autoCheckoutThanksEnabled: updates.autoCheckoutThanksEnabled ?? existing?.autoCheckoutThanksEnabled ?? true,
                cleaningReminderEnabled: updates.cleaningReminderEnabled ?? existing?.cleaningReminderEnabled ?? false,
                autoFirstReplyEnabled: updates.autoFirstReplyEnabled ?? existing?.autoFirstReplyEnabled ?? false,
                quietHoursEnabled: updates.quietHoursEnabled ?? existing?.quietHoursEnabled ?? false,
                quietHoursStart: updates.quietHoursStart ?? existing?.quietHoursStart ?? "23:00",
                quietHoursEnd: updates.quietHoursEnd ?? existing?.quietHoursEnd ?? "08:00",
            };
            await automationService.upsertSettings(merged);
            res.json({ success: true });
        }
        catch (error) {
            console.error("Update automation settings error:", error);
            res.status(500).json({ message: "Failed to update automation settings" });
        }
    });
}
