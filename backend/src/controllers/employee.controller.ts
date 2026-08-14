import { Response } from "express";
import { AuthRequest } from "../types";
import { employeeService } from "../services/employee.service";
import { sendSuccess, asyncHandler } from "../utils/response";

export const employeeController = {
  getEmployees: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeService.getEmployees(req.query as any);
    return sendSuccess(res, result, "Employees retrieved successfully");
  }),

  getEmployeeById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.getEmployeeById(req.params.id);
    return sendSuccess(res, employee, "Employee profile retrieved successfully");
  }),

  createEmployee: asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.createEmployee(req.body);
    return sendSuccess(res, employee, "Employee created successfully", 201);
  }),

  updateEmployee: asyncHandler(async (req: AuthRequest, res: Response) => {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    return sendSuccess(res, employee, "Employee updated successfully");
  }),

  deleteEmployee: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await employeeService.deleteEmployee(req.params.id);
    return sendSuccess(res, result, "Employee deleted successfully");
  }),
};
