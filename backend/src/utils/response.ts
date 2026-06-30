import { Response } from "express";
import { ApiResponse } from "../types";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors?: Record<string, string[]>,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200
) => {
  const response: ApiResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  errors?: Record<string, string[]>,
  code?: string,
  requestId?: string
) => {
  const response: ApiResponse = { success: false, message, errors, code, requestId };
  return res.status(statusCode).json(response);
};

export const asyncHandler =
  <T extends (...args: never[]) => Promise<unknown>>(fn: T) =>
  (...args: Parameters<T>) => {
    const fnReturn = fn(...args);
    const next = args[args.length - 1] as (err: unknown) => void;
    return Promise.resolve(fnReturn).catch(next);
  };
