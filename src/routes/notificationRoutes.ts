import { Router } from "express";
import { catchAsync } from "../utils/catch-async.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getAllNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  createTestNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", catchAsync(getAllNotifications));
router.get("/unread/count", catchAsync(getUnreadNotificationCount));
router.put("/:id/read", catchAsync(markNotificationAsRead));
router.put("/read/all", catchAsync(markAllNotificationsAsRead));
router.post("/test", catchAsync(createTestNotification)); // Test endpoint

export default router;

