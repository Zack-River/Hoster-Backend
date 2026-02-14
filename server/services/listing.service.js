import db from "../db";
export class ListingService {
    async getListings(userId) {
        const listings = await db.listing.findMany({
            where: { userId },
            include: {
                photos: true,
                amenities: {
                    include: {
                        amenity: true
                    }
                }
            }
        });
        return listings.map(l => ({
            ...l,
            photos: l.photos.map(p => p.url),
            amenities: l.amenities.map(a => a.amenity.name)
        }));
    }
    async getListingById(id) {
        const l = await db.listing.findUnique({
            where: { id },
            include: {
                photos: true,
                amenities: {
                    include: {
                        amenity: true
                    }
                }
            }
        });
        if (!l)
            return null;
        return {
            ...l,
            photos: l.photos.map(p => p.url),
            amenities: l.amenities.map(a => a.amenity.name)
        };
    }
    async createListing(data) {
        const { photos, amenities, userId, user, ...rest } = data;
        return db.listing.create({
            data: {
                ...rest,
                user: user || (userId ? { connect: { id: userId } } : undefined),
                photos: photos ? {
                    create: photos.map((url) => ({ url }))
                } : undefined,
                amenities: amenities ? {
                    create: await Promise.all(amenities.map(async (name) => {
                        const amenity = await db.amenity.upsert({
                            where: { name },
                            update: {},
                            create: { name }
                        });
                        return {
                            amenity: { connect: { id: amenity.id } }
                        };
                    }))
                } : undefined
            },
            include: {
                photos: true,
                amenities: { include: { amenity: true } }
            }
        });
    }
    async updateListing(id, data) {
        const { photos, amenities, ...rest } = data;
        const updateData = { ...rest };
        if (photos) {
            updateData.photos = {
                deleteMany: {},
                create: photos.map((url) => ({ url }))
            };
        }
        if (amenities) {
            updateData.amenities = {
                deleteMany: {},
                create: await Promise.all(amenities.map(async (name) => {
                    const amenity = await db.amenity.upsert({
                        where: { name },
                        update: {},
                        create: { name }
                    });
                    return {
                        amenity: { connect: { id: amenity.id } }
                    };
                }))
            };
        }
        return db.listing.update({
            where: { id },
            data: updateData,
            include: {
                photos: true,
                amenities: { include: { amenity: true } }
            }
        });
    }
    async getExternalListingMaps(listingId) {
        return db.externalListingMap.findMany({
            where: { listingId },
            include: { channel: true },
        });
    }
    async getExternalListingMapsByChannel(channelId) {
        return db.externalListingMap.findMany({ where: { channelId } });
    }
    async upsertExternalListingMap(data) {
        const { listingId, channelId, externalListingId, externalName } = data;
        return db.externalListingMap.upsert({
            where: {
                channelId_externalListingId: {
                    channelId,
                    externalListingId,
                },
            },
            update: {
                listing: { connect: { id: listingId } },
                externalName,
                lastSyncedAt: new Date(),
            },
            create: {
                listing: { connect: { id: listingId } },
                channel: { connect: { id: channelId } },
                externalListingId,
                externalName,
                lastSyncedAt: new Date(),
            },
        });
    }
    async findListingByExternalId(channelId, externalListingId) {
        return db.externalListingMap.findUnique({
            where: {
                channelId_externalListingId: {
                    channelId,
                    externalListingId,
                },
            },
        });
    }
}
export const listingService = new ListingService();
