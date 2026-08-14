import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { positionController } from "../controllers/position.controller";
import {
  createPositionSchema,
  updatePositionSchema,
  positionIdParamSchema,
  getPositionsQuerySchema,
} from "../validators/position.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(getPositionsQuerySchema),
  positionController.getPositions
);

router.get(
  "/:id",
  validate(positionIdParamSchema),
  positionController.getPositionById
);

router.post(
  "/",
  authorize(Role.ADMIN),
  validate(createPositionSchema),
  positionController.createPosition
);

router.put(
  "/:id",
  authorize(Role.ADMIN),
  validate(updatePositionSchema),
  positionController.updatePosition
);

router.delete(
  "/:id",
  authorize(Role.ADMIN),
  validate(positionIdParamSchema),
  positionController.deletePosition
);

export default router;
