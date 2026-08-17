import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { requestLoggerMiddleware } from "./middleware/request-logger.middleware";
import {
  globalRateLimiter,
  loginRateLimiter,
  attendanceRateLimiter,
} from "./middleware/rate-limit.middleware";
import authRoutes from "./routes/auth.routes";
import attendanceRoutes from "./routes/attendance.routes";
import adminRoutes from "./routes/admin.routes";
import deviceRoutes from "./routes/device.routes";
import userRoutes from "./routes/user.routes";
import departmentRoutes from "./routes/department.routes";
import positionRoutes from "./routes/position.routes";
import employeeRoutes from "./routes/employee.routes";
import leaveRoutes from "./routes/leave.routes";
import overtimeRoutes from "./routes/overtime.routes";
import payrollRoutes from "./routes/payroll.routes";
import reportRoutes from "./routes/report.routes";
import holidayRoutes from "./routes/holiday.routes";
import performanceRoutes from "./routes/performance.routes";
import atsRoutes from "./routes/ats.routes";
import assetRoutes from "./routes/asset.routes";
import trainingRoutes from "./routes/training.routes";
import documentRoutes from "./routes/document.routes";
import notificationRoutes from "./routes/notification.routes";

const app = express();

app.set("trust proxy", 1);

app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

app.use("/api", globalRateLimiter);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Attendance API is running", timestamp: new Date().toISOString() });
});

app.use("/api/auth/login", loginRateLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/attendance/check", attendanceRateLimiter);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/overtime", overtimeRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/ats", atsRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
