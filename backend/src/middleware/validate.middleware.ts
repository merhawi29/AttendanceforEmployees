import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { AppError } from "../utils/response";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const path = err.path.slice(1).join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });
        next(new AppError(400, "Validation failed", errors));
      } else {
        next(error);
      }
    }
  };
