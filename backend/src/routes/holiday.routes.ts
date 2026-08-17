import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { holidayController } from "../controllers/holiday.controller";
import {
  createHolidaySchema,
  updateHolidaySchema,
  holidayIdParamSchema,
  getHolidaysQuerySchema,
} from "../validators/holiday.validator";
import { Role } from "@prisma/client";

const router = Router();

router.use(authenticate);

// Public / Authenticated Endpoints
router.get("/", validate(getHolidaysQuerySchema), holidayController.getHolidays);
router.get("/stats", holidayController.getHolidayStats);
router.get("/upcoming", holidayController.getUpcomingHolidays);
router.get("/calendar", holidayController.getHolidayCalendar);
router.get("/reports/summary", holidayController.getHolidaySummaryReport);
router.get("/:id", validate(holidayIdParamSchema), holidayController.getHolidayById);

// Admin Only Endpoints
router.post(
  "/",
  authorize(Role.ADMIN),
  validate(createHolidaySchema),
  holidayController.createHoliday
);

router.put(
  "/:id",
  authorize(Role.ADMIN),
  validate(updateHolidaySchema),
  holidayController.updateHoliday
);

router.delete(
  "/:id",
  authorize(Role.ADMIN),
  validate(holidayIdParamSchema),
  holidayController.deleteHoliday
);

export default router;
