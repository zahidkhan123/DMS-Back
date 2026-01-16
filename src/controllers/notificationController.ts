import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { useSuccessResponse, useErrorResponse } from "../utils/apiResponse.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
} from "../services/notificationService.js";
import { emitNotification } from "../services/socketService.js";

export const getAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const notifications = await getNotifications(req.user.id, limit);
  useSuccessResponse(res, "Notifications retrieved successfully", { notifications }, 200);
};

export const getUnreadNotificationCount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const count = await getUnreadCount(req.user.id);
  useSuccessResponse(res, "Unread count retrieved successfully", { count }, 200);
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const { id } = req.params;
  const notification = await markAsRead(id, req.user.id);
  useSuccessResponse(res, "Notification marked as read", { notification }, 200);
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  await markAllAsRead(req.user.id);
  useSuccessResponse(res, "All notifications marked as read", {}, 200);
};

export const createTestNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    useErrorResponse(res, "Authentication required", 401);
    return;
  }

  const { title, message, type } = req.body;
  const notification = await createNotification(
    req.user.id,
    type || "test",
    title || "Test Notification",
    message || "This is a test notification"
  );

  // Emit socket event
  await emitNotification(notification.toJSON(), req.user.id);

  useSuccessResponse(res, "Test notification created", { notification }, 201);
};

