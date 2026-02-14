export * from "./models/auth";

import { z } from "zod";

// Enums
export const channelKeyEnum = ["AIRBNB", "BOOKING", "EXPEDIA", "TRIPADVISOR"] as const;
export const connectionStatusEnum = ["CONNECTED", "DISCONNECTED", "ERROR"] as const;
export const listingStatusEnum = ["ACTIVE", "INACTIVE"] as const;
export const reservationStatusEnum = ["INQUIRY", "CONFIRMED", "CANCELED", "CHECKED_IN", "CHECKED_OUT", "PENDING", "REJECTED"] as const;
export const calendarDayStatusEnum = ["AVAILABLE", "BLOCKED", "RESERVED"] as const;
export const calendarSourceEnum = ["MANUAL", "CHANNEL"] as const;
export const messageDirectionEnum = ["INBOUND", "OUTBOUND"] as const;
export const cleaningTaskStatusEnum = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;
export const helperTypeEnum = ["CLEANING", "MAINTENANCE"] as const;
export const helperRequestStatusEnum = ["PENDING", "APPROVED", "REJECTED"] as const;
export const cleaningSubscriptionStatusEnum = ["PENDING", "ACCEPTED", "DECLINED"] as const;
export const providerMessageSenderEnum = ["HOST", "PROVIDER"] as const;

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

// Types
export type Channel = {
  id: string;
  key: typeof channelKeyEnum[number];
  name: string;
  logoUrl: string | null;
};

export type ChannelConnection = z.infer<typeof insertChannelConnectionSchema> & { id: string; status: typeof connectionStatusEnum[number]; lastSyncAt: Date | null; lastError: string | null };
export type Listing = z.infer<typeof insertListingSchema> & { id: string; createdAt: Date | null };
export type Photo = z.infer<typeof insertPhotoSchema> & { id: string; createdAt: Date | null };
export type Amenity = z.infer<typeof insertAmenitySchema> & { id: string };
export type ListingAmenity = z.infer<typeof insertListingAmenitySchema>;
export type Reservation = z.infer<typeof insertReservationSchema> & { id: string; updatedAt: Date | null };
export type CalendarDay = z.infer<typeof insertCalendarDaySchema> & { id: string };
export type Conversation = z.infer<typeof insertConversationSchema> & { id: string; lastMessageAt: Date | null; unreadCount: number };
export type Message = z.infer<typeof insertMessageSchema> & { id: string; sentAt: Date | null };
export type Template = z.infer<typeof insertTemplateSchema> & { id: string };
export type ReminderSetting = z.infer<typeof insertReminderSettingsSchema> & { id: string };
export type Notification = z.infer<typeof insertNotificationSchema> & { id: string; createdAt: Date | null; readAt: Date | null };
export type CleaningTask = z.infer<typeof insertCleaningTaskSchema> & { id: string; scheduledAt: Date | null; completedAt: Date | null };
export type AutomationSettings = z.infer<typeof insertAutomationSettingsSchema> & { id: string; updatedAt: Date | null };
export type SupportMessage = z.infer<typeof insertSupportMessageSchema> & { id: string; sentAt: Date | null };
export type ExternalListingMap = z.infer<typeof insertExternalListingMapSchema> & { id: string; lastSyncedAt: Date | null };
export type AuditLog = z.infer<typeof insertAuditLogSchema> & { id: string; createdAt: Date | null };
export type ServiceProvider = z.infer<typeof insertServiceProviderSchema> & { id: string; status: string; createdAt: Date | null; updatedAt: Date | null };
export type CleaningSubscription = z.infer<typeof insertCleaningSubscriptionSchema> & { id: string; createdAt: Date | null; updatedAt: Date | null };
export type SubscriptionListing = z.infer<typeof insertSubscriptionListingSchema>;
export type CleaningVisitReport = z.infer<typeof insertCleaningVisitReportSchema> & { id: string; createdAt: Date | null };
export type CleaningReview = z.infer<typeof insertCleaningReviewSchema> & { id: string; createdAt: Date | null };
export type ProviderMessage = z.infer<typeof insertProviderMessageSchema> & { id: string; sentAt: Date | null };

// Insert Types
export type InsertChannelConnection = z.infer<typeof insertChannelConnectionSchema>;
export type InsertListing = z.infer<typeof insertListingSchema>;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type InsertAmenity = z.infer<typeof insertAmenitySchema>;
export type InsertListingAmenity = z.infer<typeof insertListingAmenitySchema>;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type InsertCalendarDay = z.infer<typeof insertCalendarDaySchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertReminderSetting = z.infer<typeof insertReminderSettingsSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCleaningTask = z.infer<typeof insertCleaningTaskSchema>;
export type InsertAutomationSettings = z.infer<typeof insertAutomationSettingsSchema>;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;
export type InsertExternalListingMap = z.infer<typeof insertExternalListingMapSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type InsertCleaningSubscription = z.infer<typeof insertCleaningSubscriptionSchema>;
export type InsertSubscriptionListing = z.infer<typeof insertSubscriptionListingSchema>;
export type InsertCleaningVisitReport = z.infer<typeof insertCleaningVisitReportSchema>;
export type InsertCleaningReview = z.infer<typeof insertCleaningReviewSchema>;
export type InsertProviderMessage = z.infer<typeof insertProviderMessageSchema>;
