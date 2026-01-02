// src/routes/plans.routes.js
import { Router } from "express";
import { renderPlansPage, getAllPlans } from "../controllers/plans.controller.js";
import { verifyUser } from '../middleware/authMiddleware.js';

const router = Router();

// Frontend page route
router.get("/plans", verifyUser, renderPlansPage);

// API route to fetch all plans
router.get("/api/v1/plans", verifyUser, getAllPlans);

export default router;


