import db from "../db";
export class UserService {
    async getUser(id) {
        return db.user.findUnique({ where: { id } });
    }
    async getUserByEmail(email) {
        return db.user.findUnique({ where: { email } });
    }
    async createUser(data) {
        return db.user.create({ data });
    }
    async updateUser(id, data) {
        return db.user.update({
            where: { id },
            data: { ...data, updatedAt: new Date() },
        });
    }
    async getAllUserIds() {
        const users = await db.user.findMany({ select: { id: true } });
        return users.map((u) => u.id);
    }
}
export const userService = new UserService();
