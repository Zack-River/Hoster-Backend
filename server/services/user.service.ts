import db from "../db";
import { User, Prisma } from "@prisma/client";

export class UserService {
  async getUser(id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return db.user.create({ data });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User | null> {
    return db.user.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  async getAllUserIds(): Promise<string[]> {
    const users = await db.user.findMany({ select: { id: true } });
    return users.map((u) => u.id);
  }
}

export const userService = new UserService();
