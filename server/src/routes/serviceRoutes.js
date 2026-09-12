import { Router } from "express";
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  toggleServiceActive,
  uploadServiceImage,
} from "../controllers/serviceController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { upload, verifyImageSignature } from "../middleware/upload.js";

const router = Router();

router.get("/", listServices);
router.get("/:id", getService);
router.post("/", requireAdmin, createService);
router.put("/:id", requireAdmin, updateService);
router.delete("/:id", requireAdmin, deleteService);
router.patch("/:id/toggle-active", requireAdmin, toggleServiceActive);
router.post("/:id/image", requireAdmin, uploadLimiter, upload.single("image"), verifyImageSignature, uploadServiceImage);

export default router;
