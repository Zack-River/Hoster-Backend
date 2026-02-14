import db from "../db";
export class CleaningService {
    async createCleaningTask(data) {
        return db.cleaningTask.create({ data });
    }
    async getCleaningTasks(userId) {
        const tasks = await db.cleaningTask.findMany({
            where: { userId },
            orderBy: { scheduledAt: 'desc' },
            include: {
                listing: true,
                reservation: true
            }
        });
        return tasks;
    }
    async updateCleaningTaskStatus(id, status) {
        const data = { status };
        if (status === "COMPLETED") {
            data.completedAt = new Date();
        }
        await db.cleaningTask.update({
            where: { id },
            data
        });
    }
}
export const cleaningService = new CleaningService();
