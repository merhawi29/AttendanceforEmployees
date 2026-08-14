import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { departmentController } from "../controllers/department.controller";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentIdParamSchema,
  getDepartmentsQuerySchema,
} from "../validators/department.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(getDepartmentsQuerySchema),
  departmentController.getDepartments
);

router.get(
  "/tree",
  departmentController.getDepartmentTree
);

router.get(
  "/:id",
  validate(departmentIdParamSchema),
  departmentController.getDepartmentById
);

router.post(
  "/",
  authorize(Role.ADMIN),
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

router.put(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment
);

router.delete(
  "/:id",
  authorize(Role.ADMIN),
  validate(departmentIdParamSchema),
  departmentController.deleteDepartment
);

export default router;
