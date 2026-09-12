import { Router } from "express";
import {
  listAdminUsers,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  toggleAdminUserActive,
  deleteAdminUser,
} from "../controllers/adminUserController.js";
import { requireAdmin, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdmin, requireRole("Administrator"), listAdminUsers);
router.get("/:id", requireAdmin, requireRole("Administrator"), getAdminUser);
router.post("/", requireAdmin, requireRole("Administrator"), createAdminUser);
router.put("/:id", requireAdmin, requireRole("Administrator"), updateAdminUser);
router.patch("/:id/toggle-active", requireAdmin, requireRole("Administrator"), toggleAdminUserActive);
router.delete("/:id", requireAdmin, requireRole("Administrator"), deleteAdminUser);

export default router;
