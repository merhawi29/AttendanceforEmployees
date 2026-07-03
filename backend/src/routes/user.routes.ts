import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { changePasswordSchema } from "../validators/schemas";
import * as userController from "../controllers/user.controller";

const router = Router();

router.use(authenticate);

router.post("/change-password", validate(changePasswordSchema), userController.changePassword);

export default router;
