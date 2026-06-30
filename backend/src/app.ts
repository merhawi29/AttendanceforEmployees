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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
