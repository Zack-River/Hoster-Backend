import db from "../db";
import { Prisma, UserRole, ListingStatus, ReservationStatus, ConnectionStatus, ProviderType, ProviderRequestStatus, User, Listing, ChannelConnection, Reservation, ServiceProvider, ProviderRequest } from "@prisma/client";
import bcrypt from "bcryptjs";

export class AdminService {
  async getStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      hostCount,
      providerCount,
      adminCount,
      newHostsCount,
      totalListings,
      activeConnections,
      totalBookings,
      totalMessages,
      totalAutomations,
      syncErrors,
      cleaningByStatus,
      revenueResult
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "host" } }),
      db.user.count({ where: { role: "provider" } }),
      db.user.count({ where: { role: "admin" } }),
      db.user.count({ 
        where: { 
          role: "host",
          createdAt: { gte: thirtyDaysAgo }
        } 
      }),
      db.listing.count(),
      db.channelConnection.count({ where: { status: "CONNECTED" } }),
      db.reservation.count(),
      db.message.count(),
      db.automationActionLog.count(),
      db.channelConnection.count({ where: { status: "ERROR" } }),
      db.cleaningTask.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.reservation.aggregate({
        _sum: { totalAmount: true }
      })
    ]);

    const cleaningStats: Record<string, number> = {};
    for (const row of cleaningByStatus) {
      cleaningStats[row.status] = row._count;
    }
    const totalWorkOrders = Object.values(cleaningStats).reduce((a, b) => a + b, 0);

    const channelDistributionRaw = await db.channelConnection.groupBy({
      by: ['channelId'],
      where: { status: "CONNECTED" },
      _count: true,
    });

    const channels = await db.channel.findMany();
    const channelDistribution = channelDistributionRaw.map(cd => ({
      channelName: channels.find(c => c.id === cd.channelId)?.name || "Unknown",
      value: cd._count,
    }));

    return {
      users: {
        total: totalUsers,
        hosts: hostCount,
        providers: providerCount,
        admins: adminCount,
      },
      newHosts: newHostsCount,
      totalListings,
      activeConnections,
      totalBookings,
      totalMessages,
      totalWorkOrders,
      totalAutomations,
      syncErrors,
      channelDistribution,
    };
  }

  async setupAdmin(userId: string) {
    const existingAdmin = await db.user.findFirst({ where: { role: "admin" } });
    if (existingAdmin) throw new Error("Admin already exists");
    await db.user.update({ where: { id: userId }, data: { role: "admin" } });
  }

  async getUsers(search?: string, role?: string) {
    const where: Prisma.UserWhereInput = {};
    if (role) {
      where.role = role as UserRole;
    }
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const allUsers = await db.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        listings: { select: { id: true } },
        channelConnections: { where: { status: "CONNECTED" }, select: { id: true } },
      }
    });

    return Promise.all(
      allUsers.map(async (user) => {
        const listingIds = user.listings.map(l => l.id);
        const reservationCount = listingIds.length > 0 
          ? await db.reservation.count({ where: { listingId: { in: listingIds } } }) 
          : 0;

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          country: user.country,
          phone: user.phone,
          profileImageUrl: user.profileImageUrl,
          companyName: user.companyName,
          crNumber: user.crNumber,
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
          blocked: user.blocked,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          listingCount: user.listings.length,
          reservationCount,
          connectedChannels: user.channelConnections.length,
        };
      })
    );
  }

  async createUser(data: any) {
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error("A user with this email already exists");

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const newUser = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: data.role as UserRole,
        phone: data.phone || null,
        country: data.country || null,
        companyName: data.companyName || null,
        subscriptionPlan: data.subscriptionPlan,
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async getUserDetail(userId: string) {
    const user = await db.user.findUnique({ 
      where: { id: userId },
      include: {
        listings: {
          include: {
             _count: { select: { reservations: true } }
          }
        },
        channelConnections: {
          include: { channel: true }
        }
      }
    });
    
    if (!user) return null;

    const { password, ...userWithoutPassword } = user;

    const listingsWithStats = user.listings.map(listing => ({
      ...listing,
      reservationCount: listing._count.reservations,
    }));

    const userConnections = user.channelConnections.map(cc => ({
        id: cc.id,
        channelId: cc.channelId,
        status: cc.status,
        lastSyncAt: cc.lastSyncAt,
        lastError: cc.lastError,
        channelKey: cc.channel.key,
        channelName: cc.channel.name,
    }));

    let recentReservations: any[] = [];
    if (user.listings.length > 0) {
      const listingIds = user.listings.map(l => l.id);
      recentReservations = await db.reservation.findMany({
        where: { listingId: { in: listingIds } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          channel: true,
          listing: true
        }
      });
      
      recentReservations = recentReservations.map(r => ({
          id: r.id,
          listingId: r.listingId,
          guestName: r.guestName,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          status: r.status,
          totalAmount: r.totalAmount,
          currency: r.currency,
          updatedAt: r.updatedAt,
          channelKey: r.channel.key,
          channelName: r.channel.name,
          listingName: r.listing.name,
      }));
    }

    return {
      user: userWithoutPassword,
      listings: listingsWithStats,
      channelConnections: userConnections,
      recentReservations,
    };
  }

  async setUserBlocked(userId: string, blocked: boolean) {
    await db.user.update({ where: { id: userId }, data: { blocked, updatedAt: new Date() } });
  }

  async setUserRole(userId: string, role: UserRole) {
    await db.user.update({ where: { id: userId }, data: { role, updatedAt: new Date() } });
  }

  async getFinanceData() {
    const plans = [
      { key: "light", name: "Light", maxUnits: 1, price: 0 },
      { key: "growth", name: "Growth", maxUnits: 5, price: 19 },
      { key: "expanding", name: "Expanding", maxUnits: 15, price: 39 },
    ];

    const allHosts = await db.user.findMany({
      where: { role: "host" },
      include: {
        _count: { select: { listings: true } }
      }
    });

    const hostSubscriptions = allHosts.map(host => {
        const plan = plans.find(p => p.key === (host.subscriptionPlan || "light")) || plans[0];
        return {
          userId: host.id,
          email: host.email,
          firstName: host.firstName,
          lastName: host.lastName,
          plan: plan.key,
          planName: plan.name,
          price: plan.price,
          unitCount: host._count.listings,
          maxUnits: plan.maxUnits,
          createdAt: host.createdAt?.toISOString() ?? null,
        };
    });

    const planDistribution = plans.map(p => ({
      plan: p.key,
      name: p.name,
      price: p.price,
      count: hostSubscriptions.filter(h => h.plan === p.key).length,
    }));

    const mrr = hostSubscriptions.reduce((acc, h) => acc + h.price, 0);
    const arr = mrr * 12;
    const totalSubscribers = hostSubscriptions.length;
    const paidSubscribers = hostSubscriptions.filter(h => h.price > 0).length;
    const freeSubscribers = hostSubscriptions.filter(h => h.price === 0).length;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newSubscribers = hostSubscriptions.filter(h => h.createdAt && new Date(h.createdAt) >= thirtyDaysAgo).length;

    const revenueResult = await db.reservation.aggregate({
      _sum: { totalAmount: true }
    });
    const totalRevenue = revenueResult._sum.totalAmount ? Number(revenueResult._sum.totalAmount) : 0;

    const allProviders = await db.serviceProvider.findMany({ 
        where: { status: "active" },
        select: { commissionRate: true }
    });
    
    const avgCommission = allProviders.length > 0
      ? allProviders.reduce((acc, p) => acc + (p.commissionRate ? Number(p.commissionRate) : 10), 0) / allProviders.length
      : 10;
    const providerCommission = Math.round(totalRevenue * (avgCommission / 100));

    return {
      overview: {
        mrr,
        arr,
        totalSubscribers,
        paidSubscribers,
        freeSubscribers,
        newSubscribers,
        totalRevenue,
        providerCommission,
      },
      planDistribution,
      subscribers: hostSubscriptions,
    };
  }

  async getProviders(type?: ProviderType) {
    const where: Prisma.ServiceProviderWhereInput = {};
    if (type) where.type = type;
    return db.serviceProvider.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createProvider(data: any) {
    return db.serviceProvider.create({
      data: {
        name: data.name,
        type: data.type as ProviderType,
        email: data.email || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        description: data.description || null,
        commissionRate: data.commissionRate || 10.00,
      }
    });
  }

  async updateProvider(id: string, data: any) {
    return db.serviceProvider.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    });
  }

  async deleteProvider(id: string) {
    await db.providerPromotion.deleteMany({ where: { providerId: id } });
    return db.serviceProvider.delete({ where: { id } });
  }

  async getProviderRequests() {
    return db.providerRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createProviderRequest(data: any) {
    return db.providerRequest.create({
      data: {
        name: data.name,
        type: data.type as ProviderType,
        email: data.email || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        message: data.message || null,
      }
    });
  }

  async updateProviderRequest(id: string, status: ProviderRequestStatus) {
    const request = await db.providerRequest.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });

    if (status === "APPROVED") {
      await db.serviceProvider.create({
        data: {
          name: request.name,
          type: request.type,
          email: request.email,
          phone: request.phone,
          companyName: request.companyName,
        }
      });
    }
    return request;
  }

  async getProviderPromotions(providerId: string) {
    return db.providerPromotion.findMany({
        where: { providerId },
        orderBy: { createdAt: 'desc' }
    });
  }

  async createPromotion(providerId: string, data: any) {
    return db.providerPromotion.create({
        data: { ...data, providerId }
    });
  }

  async deletePromotion(id: string) {
    return db.providerPromotion.delete({ where: { id } });
  }

  async getConversations() {
    const conversations = await db.conversation.findMany({
        include: {
            channel: true,
            listing: true
        },
        orderBy: { lastMessageAt: 'desc' }
    });

    const userIds = Array.from(new Set(conversations.map(c => c.listing.userId)));
    const users = await db.user.findMany({ where: { id: { in: userIds } } });
    const userMap = new Map(users.map(u => [u.id, u]));

    return conversations.map(c => {
        const user = userMap.get(c.listing.userId);
        return {
          id: c.id,
          guestName: c.guestName,
          lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
          unreadCount: c.unreadCount,
          channelKey: c.channel.key,
          channelName: c.channel.name,
          listingName: c.listing.name,
          userEmail: user?.email ?? null,
          userFirstName: user?.firstName ?? null,
          userLastName: user?.lastName ?? null,
        };
    });
  }

  async getConversationMessages(conversationId: string) {
    const msgs = await db.message.findMany({
        where: { conversationId },
        orderBy: { sentAt: 'asc' }
    });

    return msgs.map((m) => ({
      id: m.id,
      direction: m.direction,
      body: m.body,
      sentAt: m.sentAt?.toISOString() ?? null,
    }));
  }

  async sendMessage(conversationId: string, body: string) {
    const msg = await db.message.create({
        data: {
            conversationId,
            direction: "OUTBOUND",
            body,
        }
    });

    await db.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
    });

    return {
      id: msg.id,
      direction: msg.direction,
      body: msg.body,
      sentAt: msg.sentAt?.toISOString() ?? null,
    };
  }

  async getSupportThreads() {
    const rawThreads = await db.$queryRaw`
      SELECT 
        "userId", 
        MAX("sentAt") as "lastSentAt", 
        CAST(SUM(CASE WHEN "readByAdmin" = false AND "direction" = 'INBOUND' THEN 1 ELSE 0 END) AS INTEGER) as "unreadCount",
        COUNT(*)::INTEGER as "messageCount"
      FROM "support_messages"
      GROUP BY "userId"
      ORDER BY MAX("sentAt") DESC
    ` as any[];

    const userIds = rawThreads.map((t: any) => t.userId);
    const users = await db.user.findMany({ where: { id: { in: userIds } } });
    const userMap = new Map(users.map(u => [u.id, u]));

    return rawThreads.map(t => {
        const user = userMap.get(t.userId);
        return {
          userId: t.userId,
          userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User" : "User",
          userEmail: user?.email ?? null,
          lastMessageAt: t.lastSentAt instanceof Date ? t.lastSentAt.toISOString() : t.lastSentAt,
          unreadCount: t.unreadCount || 0,
          messageCount: t.messageCount,
        };
    });
  }

  async getSupportThreadMessages(userId: string) {
    const msgs = await db.supportMessage.findMany({
        where: { userId },
        orderBy: { sentAt: 'asc' }
    });

    await db.supportMessage.updateMany({
        where: { 
            userId, 
            readByAdmin: false, 
            direction: "INBOUND" 
        },
        data: { readByAdmin: true }
    });

    return msgs.map(m => ({
      id: m.id,
      direction: m.direction,
      body: m.body,
      sentAt: m.sentAt?.toISOString() ?? null,
    }));
  }

  async sendSupportMessage(userId: string, body: string) {
    const msg = await db.supportMessage.create({
        data: {
            userId,
            direction: "OUTBOUND",
            body,
            readByAdmin: true,
            readByUser: false 
        }
    });
    
    return {
      id: msg.id,
      direction: msg.direction,
      body: msg.body,
      sentAt: msg.sentAt?.toISOString() ?? null,
    };
  }
}

export const adminService = new AdminService();
