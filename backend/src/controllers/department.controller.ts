import { Response } from "express";
import { AuthRequest } from "../types";
import { departmentService } from "../services/department.service";
import { sendSuccess, asyncHandler } from "../utils/response";

export const departmentController = {
  getDepartments: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await departmentService.getDepartments(req.query as any);
    return sendSuccess(res, result, "Departments retrieved successfully");
  }),

  getDepartmentById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const department = await departmentService.getDepartmentById(req.params.id);
    return sendSuccess(res, department, "Department details retrieved successfully");
  }),

  getDepartmentTree: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const tree = await departmentService.getDepartmentTree();
    return sendSuccess(res, tree, "Department tree retrieved successfully");
  }),

  createDepartment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const department = await departmentService.createDepartment(req.body);
    return sendSuccess(res, department, "Department created successfully", 201);
  }),

  updateDepartment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    return sendSuccess(res, department, "Department updated successfully");
  }),

  deleteDepartment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await departmentService.deleteDepartment(req.params.id);
    return sendSuccess(res, result, "Department deleted successfully");
  }),
};
