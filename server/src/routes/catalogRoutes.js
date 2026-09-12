import { Router } from "express";
import {
  listCatalog,
  getCatalogById,
  createCatalogCategory,
  updateCatalogCategory,
  updateCatalogStatus,
  updateCatalogAvailability,
  deleteCatalogCategory,
  uploadCatalogImage,
  removeCatalogImage,
} from "../controllers/catalogController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { upload, verifyImageSignature } from "../middleware/upload.js";

const router = Router();

router.get("/", listCatalog);
router.get("/:id", getCatalogById);
router.post("/", requireAdmin, createCatalogCategory);
router.put("/:id", requireAdmin, updateCatalogCategory);
router.patch("/:id/status", requireAdmin, updateCatalogStatus);
router.patch("/:id/availability", requireAdmin, updateCatalogAvailability);
router.post("/:id/image", requireAdmin, uploadLimiter, upload.single("image"), verifyImageSignature, uploadCatalogImage);
router.delete("/:id/image", requireAdmin, removeCatalogImage);
router.delete("/:id", requireAdmin, deleteCatalogCategory);

export default router;
