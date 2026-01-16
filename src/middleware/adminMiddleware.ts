import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { useErrorResponse } from "../utils/apiResponse.js";
import User from "../models/User.js";

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  // Verify user from database to ensure admin status is current
  User.findByPk(req.user.id, {
    attributes: ["id", "user_type", "role"],
  })
    .then((dbUser) => {
      if (!dbUser) {
        useErrorResponse(res, "User not found", 404);
        return;
      }

      // Check both user_type and role for admin access
      const isAdmin = dbUser.user_type === "admin" || dbUser.role === "admin";

      if (!isAdmin) {
        useErrorResponse(res, "Admin access required", 403);
        return;
      }

      next();
    })
    .catch((error) => {
      useErrorResponse(res, "Error verifying admin access", 500);
    });
};

