import { Router } from "express";
import { listFaqs, createFaq, updateFaq, deleteFaq } from "../controllers/faqController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();
router.get("/", listFaqs);
router.post("/", requireAdmin, createFaq);
router.put("/:id", requireAdmin, updateFaq);
router.delete("/:id", requireAdmin, deleteFaq);
export default router;
