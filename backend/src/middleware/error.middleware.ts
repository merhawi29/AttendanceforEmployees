import { Request, Response, NextFunction } from "express";
import { AppError, sendError } from "../utils/response";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const requestId = req.requestId;

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId }, err.message);
    } else {
      logger.warn({ err: { message: err.message, code: err.code }, requestId }, "application error");
    }

    return sendError(res, err.message, err.statusCode, err.errors, err.code, requestId);
  }

  logger.error({ err, requestId }, "Unhandled error");
  return sendError(res, "Internal server error", 500, undefined, "INTERNAL_ERROR", requestId);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, "Route not found", 404, undefined, "NOT_FOUND", req.requestId);
};
