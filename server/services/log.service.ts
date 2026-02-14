import db from "../db";
import { Prisma, ApiCallLog } from "@prisma/client";

export class LogService {
  async getApiCallLogs(userId: string, limit: number = 20): Promise<ApiCallLog[]> {
    return db.apiCallLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async createApiCallLog(data: any): Promise<ApiCallLog> {
    const { userId, ...rest } = data;
    return db.apiCallLog.create({
      data: {
        ...rest,
        user: { connect: { id: userId } }
      }
    });
  }
}

export const logService = new LogService();
