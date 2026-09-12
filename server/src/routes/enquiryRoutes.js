import { Router } from "express";
import {
  createEnquiry,
  listEnquiries,
  getEnquiry,
  updateEnquiryStatus,
  deleteEnquiry,
  convertEnquiryToBooking,
  exportEnquiriesCsv,
} from "../controllers/enquiryController.js";
import { requireAdmin } from "../middleware/auth.js";
import { publicFormLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/", publicFormLimiter, createEnquiry);
router.get("/", requireAdmin, listEnquiries);

router.get("/export/csv", requireAdmin, exportEnquiriesCsv);
router.get("/:id", requireAdmin, getEnquiry);
router.put("/:id/status", requireAdmin, updateEnquiryStatus);
router.post("/:id/convert-to-booking", requireAdmin, convertEnquiryToBooking);
router.delete("/:id", requireAdmin, deleteEnquiry);

export default router;
