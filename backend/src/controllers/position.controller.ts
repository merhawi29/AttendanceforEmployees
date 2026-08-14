import { Response } from "express";
import { AuthRequest } from "../types";
import { positionService } from "../services/position.service";
import { sendSuccess, asyncHandler } from "../utils/response";

export const positionController = {
  getPositions: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await positionService.getPositions(req.query as any);
    return sendSuccess(res, result, "Positions retrieved successfully");
  }),

  getPositionById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const position = await positionService.getPositionById(req.params.id);
    return sendSuccess(res, position, "Position details retrieved successfully");
  }),

  createPosition: asyncHandler(async (req: AuthRequest, res: Response) => {
    const position = await positionService.createPosition(req.body);
    return sendSuccess(res, position, "Position created successfully", 201);
  }),

  updatePosition: asyncHandler(async (req: AuthRequest, res: Response) => {
    const position = await positionService.updatePosition(req.params.id, req.body);
    return sendSuccess(res, position, "Position updated successfully");
  }),

  deletePosition: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await positionService.deletePosition(req.params.id);
    return sendSuccess(res, result, "Position deleted successfully");
  }),
};
