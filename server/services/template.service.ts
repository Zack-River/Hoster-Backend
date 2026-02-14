import db from "../db";
import { Prisma, Template } from "@prisma/client";

export class TemplateService {
  async getTemplates(userId: string): Promise<Template[]> {
    return db.template.findMany({ where: { userId } });
  }

  async createTemplate(data: Prisma.TemplateCreateInput): Promise<Template> {
    return db.template.create({ data });
  }

  async updateTemplate(id: string, updates: Prisma.TemplateUpdateInput): Promise<void> {
    await db.template.update({
        where: { id },
        data: updates
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.template.delete({ where: { id } });
  }

  async seedTemplates(userId: string): Promise<void> {
    const existing = await this.getTemplates(userId);
    if (existing.length > 0) return;

    const defaultTemplates = [
      {
        userId,
        name: "Welcome",
        body: "Welcome! We're so glad you chose to stay with us. Check-in is at 3 PM. The door code will be sent to you the day before your arrival. Don't hesitate to reach out if you have any questions!",
      },
      {
        userId,
        name: "Check-in instructions",
        body: "Hi! Your check-in is tomorrow. Here are the details:\n\nAddress: [Your address]\nDoor code: [Code]\nWi-Fi: [Network] / [Password]\nParking: [Instructions]\n\nEnjoy your stay!",
      },
      {
        userId,
        name: "Thank you",
        body: "Thank you for staying with us! We hope you had a wonderful time. If you enjoyed your stay, we'd really appreciate a review. We'd love to host you again in the future!",
      },
    ];

    for (const t of defaultTemplates) {
      await this.createTemplate({
        user: { connect: { id: t.userId } },
        name: t.name,
        body: t.body,
      } as any);
    }
  }
}

export const templateService = new TemplateService();
