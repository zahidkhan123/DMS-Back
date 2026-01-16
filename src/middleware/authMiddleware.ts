import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { useErrorResponse } from "../utils/apiResponse.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    user_type: string;
  };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      useErrorResponse(res, "No token provided", 401);
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        user_type: decoded.user_type,
      };
      next();
    } catch (error) {
      useErrorResponse(res, "Invalid or expired token", 401);
      return;
    }
  } catch (error) {
    useErrorResponse(res, "Authentication failed", 401);
    return;
  }
};
