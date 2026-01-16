import Notification from "../models/Notification.js";
import redis from "../config/redis.js";

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string
) => {
  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    message,
    read: false,
  });

  // Invalidate notification cache
  try {
    await redis.del(`notifications:${userId}`);
    await redis.del(`notifications:unread:${userId}`);
  } catch (error) {
    // Redis cache invalidation failed
  }

  return notification;
};

export const getNotifications = async (userId: string, limit: number = 50) => {
  const cacheKey = `notifications:${userId}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    // Redis cache read failed
  }

  const notifications = await Notification.findAll({
    where: { user_id: userId },
    limit,
    order: [["created_at", "DESC"]],
  });

  const result = notifications.map((n) => n.toJSON());

  // Cache in Redis (TTL: 5 minutes)
  try {
    await redis.setex(cacheKey, 300, JSON.stringify(result));
  } catch (error) {
    // Redis cache write failed
  }

  return result;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const cacheKey = `notifications:unread:${userId}`;

  // Try Redis cache first
  try {
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return parseInt(cached);
    }
  } catch (error) {
    // Redis cache read failed
  }

  const count = await Notification.count({
    where: { user_id: userId, read: false },
  });

  // Cache in Redis (TTL: 1 minute)
  try {
    await redis.setex(cacheKey, 60, count.toString());
  } catch (error) {
    // Redis cache write failed
  }

  return count;
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await notification.update({ read: true });

  // Invalidate cache
  try {
    await redis.del(`notifications:${userId}`);
    await redis.del(`notifications:unread:${userId}`);
  } catch (error) {
    // Redis cache invalidation failed
  }

  return notification;
};

export const markAllAsRead = async (userId: string) => {
  await Notification.update(
    { read: true },
    { where: { user_id: userId, read: false } }
  );

  // Invalidate cache
  try {
    await redis.del(`notifications:${userId}`);
    await redis.del(`notifications:unread:${userId}`);
  } catch (error) {
    // Redis cache invalidation failed
  }
};

