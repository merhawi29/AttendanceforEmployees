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

  const allowedIps = await prisma.allowedIp.findMany({
    where: { isActive: true },
  });

  const allowedIp = allowedIps.find(
    (ip) => normalizeIp(ip.ipAddress.trim()) === clientIp
  );

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
