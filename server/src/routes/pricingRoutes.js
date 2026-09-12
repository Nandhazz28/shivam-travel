import { Router } from "express";
import { listPricing, createPricing, updatePricing, deletePricing } from "../controllers/pricingController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.get("/", listPricing);
router.post("/", requireAdmin, createPricing);
router.put("/:id", requireAdmin, updatePricing);
router.delete("/:id", requireAdmin, deletePricing);
export default router;
