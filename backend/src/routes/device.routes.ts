import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { registerDeviceSchema, approveDeviceSchema } from "../validators/schemas";
import * as deviceController from "../controllers/device.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate);

router.post("/register", validate(registerDeviceSchema), deviceController.registerDevice);
router.get("/status", deviceController.getDeviceStatus);
router.get("/my", deviceController.getMyDevices);
router.post("/reset", deviceController.resetMyDevices);

router.get("/admin", authorize(Role.ADMIN), deviceController.adminGetAllDevices);
router.patch("/admin/:id/approve", authorize(Role.ADMIN), validate(approveDeviceSchema), deviceController.adminApproveDevice);
router.patch("/admin/:id/toggle", authorize(Role.ADMIN), deviceController.adminToggleDevice);
router.delete("/admin/:id", authorize(Role.ADMIN), deviceController.adminDeleteDevice);

export default router;
