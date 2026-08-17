export type NotificationType =
  | "SYSTEM"
  | "LEAVE"
  | "OVERTIME"
  | "ASSET"
  | "TRAINING"
  | "DOCUMENT"
  | "PERFORMANCE"
  | "ATS"
  | "PAYROLL";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  unreadCount: number;
  totalCount: number;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}
