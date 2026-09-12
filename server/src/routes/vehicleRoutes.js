import { Router } from "express";
import {
  listVehicles,
  getVehicleBySlugOrId,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleActive,
  uploadVehicleImages,
  removeVehicleImage,
  reorderVehicles,
} from "../controllers/vehicleController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { upload, verifyImageSignature } from "../middleware/upload.js";

const router = Router();

router.get("/", listVehicles);
router.patch("/reorder", requireAdmin, reorderVehicles);
router.get("/:idOrSlug", getVehicleBySlugOrId);
router.post("/", requireAdmin, createVehicle);
router.put("/:id", requireAdmin, updateVehicle);
router.delete("/:id", requireAdmin, deleteVehicle);
router.patch("/:id/toggle-active", requireAdmin, toggleVehicleActive);
router.post("/:id/images", requireAdmin, uploadLimiter, upload.array("images", 10), verifyImageSignature, uploadVehicleImages);
router.delete("/:id/images/:publicId", requireAdmin, removeVehicleImage);

export default router;
