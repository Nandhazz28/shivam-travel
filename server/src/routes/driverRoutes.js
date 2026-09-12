import { Router } from "express";
import { listDrivers, createDriver, updateDriver, deleteDriver, uploadDriverPhoto } from "../controllers/driverController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { upload, verifyImageSignature } from "../middleware/upload.js";

const router = Router();
router.get("/", requireAdmin, listDrivers);
router.post("/", requireAdmin, createDriver);
router.put("/:id", requireAdmin, updateDriver);
router.delete("/:id", requireAdmin, deleteDriver);
router.post("/:id/photo", requireAdmin, uploadLimiter, upload.single("image"), verifyImageSignature, uploadDriverPhoto);
export default router;
