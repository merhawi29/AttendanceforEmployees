import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  allowedIpSchema,
  updateUserSchema,
  toggleIpSchema,
  idParamSchema,
  adminResetPasswordSchema,
  settingsSchema,
  adminEditAttendanceSchema,
} from "../validators/schemas";
import * as adminController from "../controllers/admin.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get("/users", adminController.getUsers);
router.patch("/users/:id", validate(updateUserSchema), adminController.updateUser);
router.delete("/users/:id", validate(idParamSchema), adminController.deleteUser);
router.post("/reset-password", validate(adminResetPasswordSchema), adminController.resetPassword);

router.get("/ips", adminController.getAllowedIps);
router.post("/ips", validate(allowedIpSchema), adminController.addAllowedIp);
router.patch("/ips/:id/toggle", validate(toggleIpSchema), adminController.toggleAllowedIp);
router.delete("/ips/:id", validate(idParamSchema), adminController.deleteAllowedIp);

router.get("/settings", adminController.getSettings);
router.post("/settings", validate(settingsSchema), adminController.updateSettings);
router.patch("/attendance/:id", validate(adminEditAttendanceSchema), adminController.editAttendance);
router.get("/users/:id/summary", adminController.getUserSummary);
router.get("/my-ip", adminController.getMyIp);

export default router;
