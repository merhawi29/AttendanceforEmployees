import { Response } from "express";
import { AuthRequest } from "../types";
import { notificationService } from "../services/notification.service";
import { asyncHandler, sendSuccess } from "../utils/response";
import { broadcastNotificationSchema } from "../validators/notification.validator";
import { NotificationType } from "@prisma/client";

export const getUserNotifications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { isRead, type, search } = req.query;
  const parsedIsRead = isRead !== undefined ? isRead === "true" : undefined;
  const result = await notificationService.getUserNotifications(req.user!.userId, {
    isRead: parsedIsRead,
    type: type as NotificationType | undefined,
    search: search as string | undefined,
  });
  sendSuccess(res, result, "Notifications retrieved");
});

export const getNotificationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await notificationService.getNotificationStats(req.user!.userId);
  sendSuccess(res, stats, "Notification stats retrieved");
});

export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;
  const notification = await notificationService.markAsRead(notificationId, req.user!.userId);
  sendSuccess(res, notification, "Notification marked as read");
});

export const markAllAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  await notificationService.markAllAsRead(req.user!.userId);
  sendSuccess(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { notificationId } = req.params;
  await notificationService.deleteNotification(notificationId, req.user!.userId);
  sendSuccess(res, null, "Notification deleted");
});

export const broadcastNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const validated = broadcastNotificationSchema.parse(req.body);
  const result = await notificationService.broadcastNotification(validated);
  sendSuccess(res, result, "Broadcast announcement sent successfully", 201);
});
