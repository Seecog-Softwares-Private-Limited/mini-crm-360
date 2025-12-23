import { Router } from "express";
import { renderDashboard, getDashboardCounts } from "../controllers/dashboard.controller.js";


const router = Router();

router.get("/dashboard", renderDashboard);
router.get("/api/v1/dashboard/counts", getDashboardCounts);

export default router;
