export * from "./models/auth";
import { z } from "zod";
// Enums
export const channelKeyEnum = ["AIRBNB", "BOOKING", "EXPEDIA", "TRIPADVISOR"];
export const connectionStatusEnum = ["CONNECTED", "DISCONNECTED", "ERROR"];
export const listingStatusEnum = ["ACTIVE", "INACTIVE"];
export const reservationStatusEnum = ["INQUIRY", "CONFIRMED", "CANCELED", "CHECKED_IN", "CHECKED_OUT", "PENDING", "REJECTED"];
export const calendarDayStatusEnum = ["AVAILABLE", "BLOCKED", "RESERVED"];
export const calendarSourceEnum = ["MANUAL", "CHANNEL"];
export const messageDirectionEnum = ["INBOUND", "OUTBOUND"];
export const cleaningTaskStatusEnum = ["PENDING", "IN_PROGRESS", "COMPLETED"];
export const helperTypeEnum = ["CLEANING", "MAINTENANCE"];
export const helperRequestStatusEnum = ["PENDING", "APPROVED", "REJECTED"];
export const cleaningSubscriptionStatusEnum = ["PENDING", "ACCEPTED", "DECLINED"];
export const providerMessageSenderEnum = ["HOST", "PROVIDER"];
// Zod Schemas for Inserts
export const insertChannelConnectionSchema = z.object({
    userId: z.string(),
    channelId: z.string(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    cursor: z.string().optional(),
});
export const insertListingSchema = z.object({
    userId: z.string(),
    name: z.string(),
    status: z.enum(listingStatusEnum).default("ACTIVE"),
});
export const insertPhotoSchema = z.object({
    url: z.string(),
    listingId: z.string().optional(),
    reportId: z.string().optional(),
});
export const insertAmenitySchema = z.object({
    name: z.string(),
});
export const insertListingAmenitySchema = z.object({
    listingId: z.string(),
    amenityId: z.string(),
});
export const insertReservationSchema = z.object({
    listingId: z.string(),
    channelId: z.string(),
    externalReservationId: z.string(),
    guestName: z.string(),
    checkIn: z.string(), // Date string
    checkOut: z.string(), // Date string
    status: z.enum(reservationStatusEnum).default("CONFIRMED"),
    totalAmount: z.union([z.number(), z.string()]).optional(),
    currency: z.string().optional(),
});
export const insertCalendarDaySchema = z.object({
    listingId: z.string(),
    date: z.string(),
    status: z.enum(calendarDayStatusEnum).default("AVAILABLE"),
    source: z.enum(calendarSourceEnum).default("MANUAL"),
    note: z.string().optional(),
});
export const insertConversationSchema = z.object({
    listingId: z.string(),
    channelId: z.string(),
    reservationId: z.string().optional(),
    guestName: z.string(),
    externalThreadId: z.string().optional(),
});
export const insertMessageSchema = z.object({
    conversationId: z.string(),
    direction: z.enum(messageDirectionEnum),
    body: z.string(),
    channelMessageId: z.string().optional(),
});
export const insertTemplateSchema = z.object({
    userId: z.string(),
    name: z.string(),
    body: z.string(),
});
export const insertReminderSettingsSchema = z.object({
    userId: z.string(),
    autoCheckinMessage: z.boolean().default(false),
    cleaningReminder: z.boolean().default(false),
    checkoutReminder: z.boolean().default(false),
    paymentReminder: z.boolean().default(false),
    reviewReminder: z.boolean().default(false),
    enabled: z.boolean().default(true),
});
export const insertNotificationSchema = z.object({
    userId: z.string(),
    type: z.string(),
    title: z.string(),
    body: z.string(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
});
export const insertCleaningTaskSchema = z.object({
    userId: z.string(),
    reservationId: z.string(),
    listingId: z.string(),
    cleaningCompany: z.string(),
    cleaningCompanyPhone: z.string().optional(),
    status: z.enum(cleaningTaskStatusEnum).default("PENDING"),
    notes: z.string().optional(),
});
export const insertExternalListingMapSchema = z.object({
    listingId: z.string(),
    channelId: z.string(),
    externalListingId: z.string(),
    externalName: z.string(),
});
export const insertAuditLogSchema = z.object({
    userId: z.string(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().optional(),
    meta: z.any().optional(),
});
export const insertServiceProviderSchema = z.object({
    name: z.string(),
    type: z.enum(helperTypeEnum),
    email: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
});
export const insertCleaningSubscriptionSchema = z.object({
    hostId: z.string(),
    providerId: z.string(),
    status: z.enum(cleaningSubscriptionStatusEnum).default("PENDING"),
    termsAccepted: z.boolean().default(false),
    declineMessage: z.string().optional(),
});
export const insertSubscriptionListingSchema = z.object({
    subscriptionId: z.string(),
    listingId: z.string(),
});
export const insertCleaningVisitReportSchema = z.object({
    subscriptionId: z.string(),
    providerId: z.string(),
    listingId: z.string(),
    visitDate: z.string(), // Date string
    notes: z.string().optional(),
});
export const insertCleaningReviewSchema = z.object({
    visitReportId: z.string(),
    subscriptionId: z.string(),
    hostId: z.string(),
    providerId: z.string(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    flaggedForAdmin: z.boolean().default(false),
});
export const insertProviderMessageSchema = z.object({
    subscriptionId: z.string(),
    senderId: z.string(),
    senderType: z.enum(providerMessageSenderEnum),
    body: z.string(),
});
// Automation and Other Schemas
export const insertAutomationSettingsSchema = z.object({
    userId: z.string(),
    autoCheckinEnabled: z.boolean().default(true),
    autoFirstReplyEnabled: z.boolean().default(false),
    quietHoursEnabled: z.boolean().default(false),
    welcomeEnabled: z.boolean().default(true),
    accessEnabled: z.boolean().default(true),
    followupEnabled: z.boolean().default(true),
});
export const insertSupportMessageSchema = z.object({
    userId: z.string(),
    direction: z.enum(messageDirectionEnum),
    body: z.string(),
});
