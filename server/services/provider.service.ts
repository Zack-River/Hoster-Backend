import db from "../db";
import { 
  CleaningSubscription, 
  CleaningVisitReport, 
  CleaningReview, 
  ProviderMessage, 
  Prisma,
  CleaningSubscriptionStatus,
  ProviderMessageSender
} from "@prisma/client";

export class ProviderService {
  async getSubscriptions(providerId: string) {
    const subs = await db.cleaningSubscription.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
          }
        },
        listings: {
          include: {
            listing: {
              include: {
                photos: true
              }
            }
          }
        }
      }
    });

    return subs.map((sub: any) => {
      return {
        ...sub,
        createdAt: sub.createdAt?.toISOString() ?? null,
        updatedAt: sub.updatedAt?.toISOString() ?? null,
        host: sub.host,
        listings: sub.listings.map((sl: any) => ({
          id: sl.listing.id,
          name: sl.listing.name,
          photos: sl.listing.photos.map((p: any) => p.url)
        })),
      };
    });
  }

  async respondToSubscription(id: string, providerId: string, status: CleaningSubscriptionStatus, declineMessage?: string) {
    const sub = await db.cleaningSubscription.findFirst({
      where: { id, providerId },
    });

    if (!sub) throw new Error("Subscription not found");
    if (sub.status !== "PENDING") throw new Error("Already responded");

    await db.cleaningSubscription.update({
      where: { id },
      data: { status, declineMessage: declineMessage || null, updatedAt: new Date() },
    });
  }

  async createVisitReport(data: Prisma.CleaningVisitReportCreateInput) {
    // Check if subscription exists and is accepted
    const subscriptionId = (data.subscription as any)?.connect?.id || (data as any).subscriptionId;
    const providerId = (data.provider as any)?.connect?.id || (data as any).providerId;

    if (!subscriptionId || !providerId) throw new Error("Missing subscription or provider ID");

    const sub = await db.cleaningSubscription.findFirst({
      where: { id: subscriptionId, providerId },
    });

    if (!sub || sub.status !== "ACCEPTED") {
      throw new Error("Invalid or inactive subscription");
    }

    const { visitDate, photos, ...rest } = data as any;
    const report = await db.cleaningVisitReport.create({
      data: {
        ...rest,
        visitDate: new Date(visitDate),
        photos: {
          create: (photos || []).map((url: string) => ({ url }))
        }
      },
      include: {
        photos: true
      }
    });

    return {
      id: report.id,
      photos: report.photos.map(p => p.url),
      notes: report.notes,
      visitDate: report.visitDate,
      createdAt: report.createdAt?.toISOString() ?? null,
    };
  }

  async getVisitReports(providerId: string) {
    const reports = await db.cleaningVisitReport.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: true,
        reviews: true,
      }
    });

    return reports.map((r) => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? null,
      listingName: r.listing?.name ?? "Unknown",
      review: r.reviews[0] ? {
        rating: r.reviews[0].rating,
        comment: r.reviews[0].comment,
        createdAt: r.reviews[0].createdAt?.toISOString() ?? null,
      } : null,
    }));
  }

  async getReviews(providerId: string) {
    const reviews = await db.cleaningReview.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
      include: {
        host: true,
      }
    });

    return reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? null,
      hostName: r.host ? `${r.host.firstName || ""} ${r.host.lastName || ""}`.trim() : "Unknown",
    }));
  }

  async getMessages(subscriptionId: string, providerId: string) {
      const sub = await db.cleaningSubscription.findFirst({
        where: { id: subscriptionId, providerId },
      });
      if (!sub) throw new Error("Subscription not found");

      const msgs = await db.providerMessage.findMany({
        where: { subscriptionId },
        orderBy: { sentAt: "asc" }
      });

      return msgs.map(m => ({
        ...m,
        sentAt: m.sentAt?.toISOString() ?? null,
      }));
  }

  async sendMessage(subscriptionId: string, senderId: string, body: string) {
    const sub = await db.cleaningSubscription.findFirst({
      where: { id: subscriptionId, providerId: senderId },
    });
    
    if (!sub) throw new Error("Subscription not found");

    const msg = await db.providerMessage.create({
      data: {
        subscriptionId,
        senderId,
        senderType: "PROVIDER",
        body: body.trim(),
      }
    });

    return { ...msg, sentAt: msg.sentAt?.toISOString() ?? null };
  }

  async getProfile(providerId: string) {
    const user = await db.user.findUnique({ where: { id: providerId } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      companyName: user.companyName,
      profileImageUrl: user.profileImageUrl,
    };
  }

  // --- Host / Public Facing Methods ---

  async getAllProviders() {
    const providers = await db.user.findMany({
      where: { role: "provider" },
      include: {
        providerReviews: true,
      }
    });

    return providers.map((p) => {
      const reviews = p.providerReviews;
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        companyName: p.companyName,
        phone: p.phone,
        email: p.email,
        profileImageUrl: p.profileImageUrl,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      };
    });
  }

  async subscribe(hostId: string, data: any) {
    const existing = await db.cleaningSubscription.findFirst({
      where: {
        hostId,
        providerId: data.providerId,
        status: "PENDING",
      },
    });

    if (existing) throw new Error("You already have a pending request with this provider");

    const sub = await db.cleaningSubscription.create({
      data: {
        hostId,
        providerId: data.providerId,
        termsAccepted: true,
        status: "PENDING",
        listings: {
          create: (data.listingIds || []).map((listingId: string) => ({
            listingId
          }))
        }
      },
    });

    return {
      ...sub,
      createdAt: sub.createdAt?.toISOString() ?? null,
      updatedAt: sub.updatedAt?.toISOString() ?? null,
    };
  }

  async getHostSubscriptions(hostId: string) {
    const subs = await db.cleaningSubscription.findMany({
      where: { hostId },
      orderBy: { createdAt: "desc" },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            phone: true,
            email: true,
            profileImageUrl: true,
          }
        },
        listings: {
          include: {
            listing: true
          }
        }
      }
    });

    return subs.map((sub: any) => {
      return {
        ...sub,
        createdAt: sub.createdAt?.toISOString() ?? null,
        updatedAt: sub.updatedAt?.toISOString() ?? null,
        provider: sub.provider,
        listings: sub.listings.map((sl: any) => ({ id: sl.listing.id, name: sl.listing.name })),
      };
    });
  }

  async getHostVisitReports(hostId: string, subscriptionId: string) {
    const sub = await db.cleaningSubscription.findFirst({
      where: { id: subscriptionId, hostId },
    });
    if (!sub) throw new Error("Subscription not found");

    const reports = await db.cleaningVisitReport.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: true,
        reviews: true,
      }
    });

    return reports.map((r) => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? null,
      listingName: r.listing?.name ?? "Unknown",
      review: r.reviews[0] ? {
        id: r.reviews[0].id,
        rating: r.reviews[0].rating,
        comment: r.reviews[0].comment,
        createdAt: r.reviews[0].createdAt?.toISOString() ?? null,
      } : null,
    }));
  }

  async createReview(hostId: string, data: any) {
    const existing = await db.cleaningReview.findFirst({
      where: { visitReportId: data.visitReportId },
    });
    if (existing) throw new Error("Already reviewed");

    const shouldFlag = data.rating <= 2 || (data.comment && data.comment.length > 50);

    const review = await db.cleaningReview.create({
      data: {
        visitReportId: data.visitReportId,
        subscriptionId: data.subscriptionId,
        hostId,
        providerId: data.providerId,
        rating: data.rating,
        comment: data.comment || null,
        flaggedForAdmin: shouldFlag || false,
      },
    });

    return { ...review, createdAt: review.createdAt?.toISOString() ?? null };
  }

  async getHostMessages(subscriptionId: string, hostId: string) {
    const sub = await db.cleaningSubscription.findFirst({
      where: { id: subscriptionId, hostId },
    });
    if (!sub) throw new Error("Subscription not found");

    const msgs = await db.providerMessage.findMany({
      where: { subscriptionId },
      orderBy: { sentAt: "asc" }
    });

    return msgs.map(m => ({ ...m, sentAt: m.sentAt?.toISOString() ?? null }));
  }

  async sendHostMessage(subscriptionId: string, senderId: string, body: string) {
    const sub = await db.cleaningSubscription.findFirst({
      where: { id: subscriptionId, hostId: senderId },
    });
    if (!sub) throw new Error("Subscription not found");

    const msg = await db.providerMessage.create({
      data: {
        subscriptionId,
        senderId,
        senderType: "HOST",
        body: body.trim(),
      }
    });

    return { ...msg, sentAt: msg.sentAt?.toISOString() ?? null };
  }
}

export const providerService = new ProviderService();
