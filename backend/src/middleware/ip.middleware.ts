import { Response, NextFunction } from "express";
import prisma from "../config/database";
import { config } from "../config";
import { AuthRequest } from "../types";
import { getClientIp, normalizeIp } from "../utils/helpers";
import { AppError } from "../utils/response";

export const ipRestriction = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  if (!config.ipRestrictionEnabled) {
    return next();
  }

  const clientIp = normalizeIp(getClientIp(req));

  const allowedIp = await prisma.allowedIp.findFirst({
    where: {
      ipAddress: { in: [clientIp, getClientIp(req)] },
      isActive: true,
    },
  });

  if (!allowedIp) {
    return next(
      new AppError(
        403,
        `Attendance is only allowed from authorized office networks. Your IP: ${clientIp}`
      )
    );
  }

  next();
};
