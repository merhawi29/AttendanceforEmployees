import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import {
  getUserNotifications,
  getNotificationStats,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  broadcastNotification,
} from "../controllers/notification.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

// User Notifications
router.get("/", getUserNotifications);
router.get("/stats", getNotificationStats);
router.patch("/read-all", markAllAsRead);
router.patch("/:notificationId/read", markAsRead);
router.delete("/:notificationId", deleteNotification);

// Admin Broadcast
router.post("/broadcast", authorize(Role.ADMIN), broadcastNotification);

export default router;
