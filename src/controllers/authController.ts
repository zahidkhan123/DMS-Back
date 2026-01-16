import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { useSuccessResponse, useErrorResponse } from "../utils/apiResponse.js";
import { registerUser, loginUser } from "../services/authService.js";
import User from "../models/User.js";

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password, name, role, user_type } = req.body;

  if (!email || !password || !name) {
    useErrorResponse(res, "Email, password, and name are required", 400);
    return;
  }

  const user = await registerUser(email, password, name, role, user_type);
  useSuccessResponse(res, "User registered successfully", { user }, 201);
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    useErrorResponse(res, "Email and password are required", 400);
    return;
  }

  const { user, token } = await loginUser(email, password);
  useSuccessResponse(res, "Login successful", { user, token }, 200);
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  // Always fetch fresh from database, don't use cache
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password_hash"] },
  });

  if (!user) {
    useErrorResponse(res, "User not found", 404);
    return;
  }

  useSuccessResponse(res, "Profile retrieved successfully", { user }, 200);
};

export const refreshSession = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  // Clear old session from Redis
  try {
    const redis = (await import("../config/redis.js")).default;
    await redis.del(`session:${req.user.id}`);
  } catch (error) {
    // Failed to clear session cache
  }

  // Fetch fresh user data
  const user = await User.findByPk(req.user.id, {
    attributes: { exclude: ["password_hash"] },
  });

  if (!user) {
    useErrorResponse(res, "User not found", 404);
    return;
  }

  // Generate new token with fresh user data
  const { generateToken } = await import("../utils/jwt.js");
  const userType = user.user_type || user.role;
  const newToken = generateToken(
    { id: user.id, role: user.role, user_type: userType },
    process.env.JWT_EXPIRES_IN || "7d"
  );

  // Store new session in Redis
  try {
    const redis = (await import("../config/redis.js")).default;
    await redis.setex(`session:${user.id}`, 7 * 24 * 60 * 60, newToken);
  } catch (error) {
    // Redis session storage failed
  }

  useSuccessResponse(res, "Session refreshed successfully", { user, token: newToken }, 200);
};

