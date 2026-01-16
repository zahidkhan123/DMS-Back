import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { useErrorResponse } from "../utils/apiResponse.js";

export const userMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const allowedRoles = ["user", "admin"];
  if (!allowedRoles.includes(req.user.user_type)) {
    useErrorResponse(res, "User access required", 403);
    return;
  }

  next();
};

