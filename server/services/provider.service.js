import db from "../db";
export class ProviderService {
    async getSubscriptions(providerId) {
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
        return subs.map((sub) => {
            return {
                ...sub,
                createdAt: sub.createdAt?.toISOString() ?? null,
                updatedAt: sub.updatedAt?.toISOString() ?? null,
                host: sub.host,
                listings: sub.listings.map((sl) => ({
                    id: sl.listing.id,
                    name: sl.listing.name,
                    photos: sl.listing.photos.map((p) => p.url)
                })),
            };
        });
    }
    async respondToSubscription(id, providerId, status, declineMessage) {
        const sub = await db.cleaningSubscription.findFirst({
            where: { id, providerId },
        });
        if (!sub)
            throw new Error("Subscription not found");
        if (sub.status !== "PENDING")
            throw new Error("Already responded");
        await db.cleaningSubscription.update({
            where: { id },
            data: { status, declineMessage: declineMessage || null, updatedAt: new Date() },
        });
    }
    async createVisitReport(data) {
        // Check if subscription exists and is accepted
        const subscriptionId = data.subscription?.connect?.id || data.subscriptionId;
        const providerId = data.provider?.connect?.id || data.providerId;
        if (!subscriptionId || !providerId)
            throw new Error("Missing subscription or provider ID");
        const sub = await db.cleaningSubscription.findFirst({
            where: { id: subscriptionId, providerId },
        });
        if (!sub || sub.status !== "ACCEPTED") {
            throw new Error("Invalid or inactive subscription");
        }
        const { visitDate, photos, ...rest } = data;
        const report = await db.cleaningVisitReport.create({
            data: {
                ...rest,
                visitDate: new Date(visitDate),
                photos: {
                    create: (photos || []).map((url) => ({ url }))
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
    async getVisitReports(providerId) {
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
    async getReviews(providerId) {
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
    async getMessages(subscriptionId, providerId) {
        const sub = await db.cleaningSubscription.findFirst({
            where: { id: subscriptionId, providerId },
        });
        if (!sub)
            throw new Error("Subscription not found");
        const msgs = await db.providerMessage.findMany({
            where: { subscriptionId },
            orderBy: { sentAt: "asc" }
        });
        return msgs.map(m => ({
            ...m,
            sentAt: m.sentAt?.toISOString() ?? null,
        }));
    }
    async sendMessage(subscriptionId, senderId, body) {
        const sub = await db.cleaningSubscription.findFirst({
            where: { id: subscriptionId, providerId: senderId },
        });
        if (!sub)
            throw new Error("Subscription not found");
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
    async getProfile(providerId) {
        const user = await db.user.findUnique({ where: { id: providerId } });
        if (!user)
            return null;
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
    async subscribe(hostId, data) {
        const existing = await db.cleaningSubscription.findFirst({
            where: {
                hostId,
                providerId: data.providerId,
                status: "PENDING",
            },
        });
        if (existing)
            throw new Error("You already have a pending request with this provider");
        const sub = await db.cleaningSubscription.create({
            data: {
                hostId,
                providerId: data.providerId,
                termsAccepted: true,
                status: "PENDING",
                listings: {
                    create: (data.listingIds || []).map((listingId) => ({
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
    async getHostSubscriptions(hostId) {
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
        return subs.map((sub) => {
            return {
                ...sub,
                createdAt: sub.createdAt?.toISOString() ?? null,
                updatedAt: sub.updatedAt?.toISOString() ?? null,
                provider: sub.provider,
                listings: sub.listings.map((sl) => ({ id: sl.listing.id, name: sl.listing.name })),
            };
        });
    }
    async getHostVisitReports(hostId, subscriptionId) {
        const sub = await db.cleaningSubscription.findFirst({
            where: { id: subscriptionId, hostId },
        });
        if (!sub)
            throw new Error("Subscription not found");
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
    async createReview(hostId, data) {
        const existing = await db.cleaningReview.findFirst({
            where: { visitReportId: data.visitReportId },
        });
        if (existing)
            throw new Error("Already reviewed");
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
    async getHostMessages(subscriptionId, hostId) {
        const sub = await db.cleaningSubscription.findFirst({
            where: { id: subscriptionId, hostId },
        });
        if (!sub)
            throw new Error("Subscription not found");
        const msgs = await db.providerMessage.findMany({
            where: { subscriptionId },
            orderBy: { sentAt: "asc" }
        });
        return msgs.map(m => ({ ...m, sentAt: m.sentAt?.toISOString() ?? null }));
    }
    async sendHostMessage(subscriptionId, senderId, body) {
        const sub = await db.cleaningSubscription.findFirst({
            where: { id: subscriptionId, hostId: senderId },
        });
        if (!sub)
            throw new Error("Subscription not found");
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
