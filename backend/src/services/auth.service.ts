import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { Role } from "../types";
import {
  getRefreshTokenExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { formatUserResponse } from "../utils/helpers";
import { AppError } from "../utils/response";
import { logger } from "../utils/logger";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
  name: string;
  employeeCode?: string;
  employeeId?: string;
  department: string;
  role?: Role;
}

const issueTokens = async (user: { id: string; email: string; role: Role }) => {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const { token: refreshToken, jti } = signRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await prisma.refreshToken.create({
    data: {
      jti,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
};

export const authService = {
  async login({ email, password, deviceId, fingerprint }: LoginInput & { deviceId?: string; fingerprint?: string }, meta?: { ip?: string; requestId?: string }) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logger.warn({ email, ip: meta?.ip, requestId: meta?.requestId }, "failed login attempt");
      throw new AppError(401, "Invalid email or password", undefined, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      logger.warn({ userId: user.id, requestId: meta?.requestId }, "login attempt on inactive account");
      throw new AppError(403, "Account is deactivated", undefined, "ACCOUNT_INACTIVE");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      logger.warn({ userId: user.id, ip: meta?.ip, requestId: meta?.requestId }, "failed login attempt");
      throw new AppError(401, "Invalid email or password", undefined, "INVALID_CREDENTIALS");
    }

    // Verify device registration for EMPLOYEES
    if (user.role === "EMPLOYEE") {
      const devices = await prisma.employeeDevice.findMany({
        where: { employeeId: user.id, isActive: true },
      });
      const approvedDevice = devices.find((d) => d.isApproved);

      if (approvedDevice) {
        const storedFingerprint = approvedDevice.fingerprint;
        const incomingFingerprint = fingerprint || null;
        const approvalStatus = approvedDevice.isApproved;

        if (approvedDevice.deviceId !== deviceId || storedFingerprint !== incomingFingerprint) {
          const reason = approvedDevice.deviceId !== deviceId
            ? "Device ID mismatch (different device)"
            : "Device fingerprint mismatch";

          logger.warn({
            userId: user.id,
            storedFingerprint,
            incomingFingerprint,
            approvalStatus,
            reason,
          }, "Device verification failed during login");

          throw new AppError(403, `Attendance system access restricted: ${reason}.`, undefined, "DEVICE_NOT_APPROVED");
        }

        logger.info({
          userId: user.id,
          storedFingerprint,
          incomingFingerprint,
          approvalStatus,
          reason: null,
        }, "Device verification succeeded during login");
      } else {
        logger.info({
          userId: user.id,
          storedFingerprint: null,
          incomingFingerprint: fingerprint || null,
          approvalStatus: false,
          reason: "No approved device exists for user yet",
        }, "Login allowed without device verification (no approved device registered)");
      }
    }

    const tokens = await issueTokens(user);
    logger.info({ userId: user.id, requestId: meta?.requestId }, "user logged in");

    return {
      ...tokens,
      user: formatUserResponse(user),
    };
  },

  async register(data: RegisterInput) {
    const employeeId = (data.employeeId || data.employeeCode || "").trim();
    if (!employeeId) {
      throw new AppError(400, "Employee ID is required", undefined, "VALIDATION_ERROR");
    }

    const email = data.email.toLowerCase().trim();

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new AppError(409, "Email already exists", undefined, "EMAIL_EXISTS");
    }

    const existingEmployeeId = await prisma.user.findUnique({
      where: { employeeId },
    });
    if (existingEmployeeId) {
      throw new AppError(409, "Employee ID already exists", undefined, "EMPLOYEE_ID_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: data.name.trim(),
        employeeId,
        department: data.department.trim(),
        role: Role.EMPLOYEE,
      },
    });

    return formatUserResponse(user);
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError(401, "Invalid or expired refresh token", undefined, "INVALID_REFRESH_TOKEN");
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { jti: payload.jti },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { jti: payload.jti! } });
      }
      throw new AppError(401, "Invalid or expired refresh token", undefined, "INVALID_REFRESH_TOKEN");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, "User not found or inactive", undefined, "USER_INACTIVE");
    }

    await prisma.refreshToken.delete({ where: { jti: payload.jti! } });

    const tokens = await issueTokens(user);

    return {
      ...tokens,
      user: formatUserResponse(user),
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) return;

    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.refreshToken.deleteMany({ where: { jti: payload.jti } });
    } catch {
      // Token may already be invalid; treat logout as successful
    }
  },

  async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async getProfile(userId: string) {
    const { employeeService } = await import("./employee.service");
    return employeeService.getEmployeeById(userId);
  },
};
