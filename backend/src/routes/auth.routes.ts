import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema, refreshSchema } from "../validators/schemas";
import * as authController from "../controllers/auth.controller";
import { Role } from "../types";

const router = Router();

router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);
router.post("/logout", validate(refreshSchema), authController.logout);

router.post(
  "/register",
  authenticate,
  authorize(Role.ADMIN),
  validate(registerSchema),
  authController.register
);

router.get("/me", authenticate, authController.getMe);
router.get("/profile", authenticate, authController.getProfile);
router.post("/logout-all", authenticate, authController.logoutAll);

export default router;
