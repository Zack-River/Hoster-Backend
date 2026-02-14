import db from "../db";
export class LogService {
    async getApiCallLogs(userId, limit = 20) {
        return db.apiCallLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    async createApiCallLog(data) {
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
