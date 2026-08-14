import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { employeeController } from "../controllers/employee.controller";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
  getEmployeesQuerySchema,
} from "../validators/employee.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(getEmployeesQuerySchema),
  employeeController.getEmployees
);

router.get(
  "/:id",
  validate(employeeIdParamSchema),
  employeeController.getEmployeeById
);

router.post(
  "/",
  authorize(Role.ADMIN),
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

router.put(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

router.delete(
  "/:id",
  authorize(Role.ADMIN),
  validate(employeeIdParamSchema),
  employeeController.deleteEmployee
);

export default router;
