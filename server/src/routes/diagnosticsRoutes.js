import { Router } from "express";
import { getDiagnostics } from "../controllers/diagnosticsController.js";
import { requireAdmin, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAdmin, requireRole("Administrator"), getDiagnostics);

export default router;
