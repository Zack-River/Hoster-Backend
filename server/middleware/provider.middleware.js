import { userService } from "../services/user.service";
export async function isProvider(req, res, next) {
    const userId = req.session?.userId;
    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await userService.getUser(userId);
    if (!user || user.role !== "provider") {
        return res.status(403).json({ message: "Provider access required" });
    }
    next();
}
