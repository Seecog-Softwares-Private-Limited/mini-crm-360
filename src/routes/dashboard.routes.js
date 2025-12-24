import { Router } from "express";
import { renderDashboard, getDashboardCounts } from "../controllers/dashboard.controller.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/dashboard", verifyUser, renderDashboard);
router.get("/api/v1/dashboard/counts", verifyUser, getDashboardCounts);

export default router;
