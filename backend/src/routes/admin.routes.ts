import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { allowedIpSchema, updateUserSchema, toggleIpSchema, idParamSchema } from "../validators/schemas";
import * as adminController from "../controllers/admin.controller";
import { Role } from "../types";

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get("/users", adminController.getUsers);
router.patch("/users/:id", validate(updateUserSchema), adminController.updateUser);
router.delete("/users/:id", validate(idParamSchema), adminController.deleteUser);

router.get("/ips", adminController.getAllowedIps);
router.post("/ips", validate(allowedIpSchema), adminController.addAllowedIp);
router.patch("/ips/:id/toggle", validate(toggleIpSchema), adminController.toggleAllowedIp);
router.delete("/ips/:id", validate(idParamSchema), adminController.deleteAllowedIp);

export default router;
