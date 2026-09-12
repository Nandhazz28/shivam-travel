import { Router } from "express";
import {
  getBusinessSettings,
  updateBusinessSettings,
  uploadLogo,
  uploadHeroImage,
  deleteHeroImage,
} from "../controllers/businessController.js";
import { requireAdmin } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimiters.js";
import { upload, verifyImageSignature } from "../middleware/upload.js";

const router = Router();

router.get("/", getBusinessSettings);
router.put("/", requireAdmin, updateBusinessSettings);
router.post("/logo", requireAdmin, uploadLimiter, upload.single("image"), verifyImageSignature, uploadLogo);
router.post("/hero-image", requireAdmin, uploadLimiter, upload.single("image"), verifyImageSignature, uploadHeroImage);
router.delete("/hero-image/:publicId", requireAdmin, deleteHeroImage);

export default router;
