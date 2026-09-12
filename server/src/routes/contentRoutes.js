import { Router } from "express";
import {
  getAllContent,
  getSectionContent,
  updateSectionContent,
  bulkUpdateContent,
  restoreSectionDefault,
} from "../controllers/contentController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", getAllContent);
router.get("/:section", getSectionContent);
router.put("/", requireAdmin, bulkUpdateContent);
router.put("/:section", requireAdmin, updateSectionContent);
router.delete("/:section", requireAdmin, restoreSectionDefault);

export default router;
