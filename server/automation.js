import db from "./db";
const CHANNEL_PERMISSIONS = {
    AIRBNB: { messagesWrite: true },
    BOOKING: { messagesWrite: true },
    EXPEDIA: { messagesWrite: false },
    TRIPADVISOR: { messagesWrite: false },
};
export async function canSendAutomatedMessage(userId, listingId, channelId) {
    const conn = await db.channelConnection.findUnique({
        where: {
            userId_channelId: {
                userId,
                channelId,
            },
        },
    });
    if (!conn) {
        return { ok: false, reason: "Channel not connected" };
    }
    if (conn.status !== "CONNECTED") {
        return { ok: false, reason: `Channel ${conn.status.toLowerCase()}` };
    }
    const channel = await db.channel.findUnique({ where: { id: channelId } });
    if (!channel) {
        return { ok: false, reason: "Channel not found" };
    }
    const perms = CHANNEL_PERMISSIONS[channel.key];
    if (perms && !perms.messagesWrite) {
        return { ok: false, reason: `Messaging not supported for ${channel.name}` };
    }
    const map = await db.externalListingMap.findUnique({
        where: {
            listingId_channelId: {
                listingId,
                channelId,
            },
        },
    });
    if (!map) {
        return { ok: false, reason: "Listing unmapped for this channel" };
    }
    return { ok: true };
}
export function quietHoursCheck(now, quietHoursEnabled, quietHoursStart, quietHoursEnd) {
    if (!quietHoursEnabled)
        return false;
    const [startH, startM] = quietHoursStart.split(":").map(Number);
    const [endH, endM] = quietHoursEnd.split(":").map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
    else {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
}
export function templateRender(body, variables) {
    let result = body;
    const replacements = {
        "{{GuestName}}": variables.GuestName,
        "{{ListingName}}": variables.ListingName,
        "{{CheckInDate}}": variables.CheckInDate,
        "{{CheckOutDate}}": variables.CheckOutDate,
        "{{CheckInTime}}": variables.CheckInTime,
        "{{DoorCode}}": variables.DoorCode,
        "{{WifiName}}": variables.WifiName,
        "{{WifiPassword}}": variables.WifiPassword,
        "{{BrochureLink}}": variables.BrochureLink,
    };
    for (const [placeholder, value] of Object.entries(replacements)) {
        if (value !== undefined) {
            result = result.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
        }
    }
    return result;
}
export function buildDedupeKey(actionType, reservationId) {
    return `${actionType}:${reservationId}`;
}
export async function isDuplicate(dedupeKey) {
    const existing = await db.automationActionLog.findUnique({
        where: { dedupeKey },
    });
    return !!existing;
}
export function checkAccessDataMissing(config) {
    const missing = [];
    if (!config.defaultCheckinTime)
        missing.push("MISSING_CHECKIN_TIME");
    if (!config.doorCodeEncrypted)
        missing.push("MISSING_DOOR_CODE");
    if (!config.wifiSsidEncrypted)
        missing.push("MISSING_WIFI_SSID");
    if (!config.wifiPasswordEncrypted)
        missing.push("MISSING_WIFI_PASSWORD");
    return missing;
}
