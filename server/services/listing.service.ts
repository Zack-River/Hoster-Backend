import db from "../db";
import { Listing, ExternalListingMap, Channel, Prisma } from "@prisma/client";

export class ListingService {
  async getListings(userId: string): Promise<any[]> {
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

  async getListingById(id: string): Promise<any | null> {
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

    if (!l) return null;

    return {
      ...l,
      photos: l.photos.map(p => p.url),
      amenities: l.amenities.map(a => a.amenity.name)
    };
  }

  async createListing(data: any): Promise<any> {
    const { photos, amenities, userId, user, ...rest } = data;
    
    return db.listing.create({
      data: {
        ...rest,
        user: user || (userId ? { connect: { id: userId } } : undefined),
        photos: photos ? {
          create: photos.map((url: string) => ({ url }))
        } : undefined,
        amenities: amenities ? {
          create: await Promise.all(amenities.map(async (name: string) => {
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

  async updateListing(id: string, data: any): Promise<any> {
    const { photos, amenities, ...rest } = data;

    const updateData: any = { ...rest };

    if (photos) {
      updateData.photos = {
        deleteMany: {},
        create: photos.map((url: string) => ({ url }))
      };
    }

    if (amenities) {
      updateData.amenities = {
        deleteMany: {},
        create: await Promise.all(amenities.map(async (name: string) => {
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

  async getExternalListingMaps(listingId: string): Promise<(ExternalListingMap & { channel: Channel })[]> {
    return db.externalListingMap.findMany({
      where: { listingId },
      include: { channel: true },
    });
  }

  async getExternalListingMapsByChannel(channelId: string): Promise<ExternalListingMap[]> {
    return db.externalListingMap.findMany({ where: { channelId } });
  }

  async upsertExternalListingMap(data: any): Promise<ExternalListingMap> {
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

  async findListingByExternalId(channelId: string, externalListingId: string): Promise<ExternalListingMap | null> {
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
