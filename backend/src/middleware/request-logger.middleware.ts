import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on("finish", () => {
    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        ip: req.ip,
      },
      "request completed"
    );
  });

  next();
};
