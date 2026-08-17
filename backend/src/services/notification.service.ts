import prisma from "../config/database";
import { NotificationType, Prisma } from "@prisma/client";
import { AppError } from "../utils/response";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}

export interface BroadcastNotificationInput {
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
  targetRole?: "ALL" | "ADMIN" | "EMPLOYEE";
}

export const notificationService = {
  async createNotification(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || NotificationType.SYSTEM,
        link: data.link || null,
        isRead: false,
      },
    });
  },

  async broadcastNotification(data: BroadcastNotificationInput) {
    const where: Prisma.UserWhereInput = {};
    if (data.targetRole && data.targetRole !== "ALL") {
      where.role = data.targetRole;
    }

    const targetUsers = await prisma.user.findMany({
      where,
      select: { id: true },
    });

    if (!targetUsers.length) {
      throw new AppError(404, "No target users found for broadcast", undefined, "NO_TARGET_USERS");
    }

    const createRecords = targetUsers.map((usr) => ({
      userId: usr.id,
      title: data.title,
      message: data.message,
      type: data.type || NotificationType.SYSTEM,
      link: data.link || null,
      isRead: false,
    }));

    return prisma.notification.createMany({
      data: createRecords,
    });
  },

  async getUserNotifications(userId: string, query: { isRead?: boolean; type?: NotificationType; search?: string }) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { message: { contains: query.search } },
      ];
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  },

  async markAsRead(notificationId: string, userId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new AppError(404, "Notification not found", undefined, "NOTIFICATION_NOT_FOUND");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  async deleteNotification(notificationId: string, userId: string) {
    const notif = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notif) {
      throw new AppError(404, "Notification not found", undefined, "NOTIFICATION_NOT_FOUND");
    }

    return prisma.notification.delete({
      where: { id: notificationId },
    });
  },

  async getNotificationStats(userId: string) {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    const totalCount = await prisma.notification.count({
      where: { userId },
    });

    return {
      unreadCount,
      totalCount,
    };
  },
};
