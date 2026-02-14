import { RequestHandler } from "express";

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if ((req.session as any).userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
