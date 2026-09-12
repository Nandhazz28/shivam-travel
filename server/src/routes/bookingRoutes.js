import { Router } from "express";
import {
  listBookings,
  getBooking,
  createBooking,
  updateBooking,
  updateBookingPricing,
  exportBookingsCsv,
  createPublicBooking,
  getBookingQuote,
} from "../controllers/bookingController.js";
import { requireAdmin } from "../middleware/auth.js";
import { publicFormLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.get("/quote", getBookingQuote);
router.post("/public", publicFormLimiter, createPublicBooking);

router.get("/", requireAdmin, listBookings);
router.get("/export/csv", requireAdmin, exportBookingsCsv);
router.get("/:id", requireAdmin, getBooking);

router.post("/", requireAdmin, createBooking);
router.put("/:id", requireAdmin, updateBooking);
router.put("/:id/pricing", requireAdmin, updateBookingPricing);

export default router;
