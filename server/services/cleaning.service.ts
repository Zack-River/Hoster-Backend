import db from "../db";
import { Prisma, CleaningTask } from "@prisma/client";

export class CleaningService {
  async createCleaningTask(data: Prisma.CleaningTaskCreateInput): Promise<CleaningTask> {
    return db.cleaningTask.create({ data });
  }

  async getCleaningTasks(userId: string) {
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

  async updateCleaningTaskStatus(id: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED"): Promise<void> {
    const data: Prisma.CleaningTaskUpdateInput = { status };
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
