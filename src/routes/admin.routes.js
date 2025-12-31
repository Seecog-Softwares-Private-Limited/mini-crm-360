// src/routes/admin.routes.js
import express from 'express';
import { verifyUser } from '../middleware/authMiddleware.js';
import { verifyAdmin } from '../middleware/adminMiddleware.js';
import {
  renderAdminPage,
  getAllPlansAdmin,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getAllMenuItems,
  updateMenuItemLock,
  bulkUpdateMenuItems
} from '../controllers/admin.controller.js';

const router = express.Router();

// Frontend route - Admin page
router.get('/admin', verifyUser, verifyAdmin, renderAdminPage);

// API routes - All require admin authentication
router.get('/api/v1/admin/plans', verifyUser, verifyAdmin, getAllPlansAdmin);
router.get('/api/v1/admin/plans/:id', verifyUser, verifyAdmin, getPlanById);
router.post('/api/v1/admin/plans', verifyUser, verifyAdmin, createPlan);
router.put('/api/v1/admin/plans/:id', verifyUser, verifyAdmin, updatePlan);
router.delete('/api/v1/admin/plans/:id', verifyUser, verifyAdmin, deletePlan);

// Menu Items Management
router.get('/api/v1/admin/menu-items', verifyUser, verifyAdmin, getAllMenuItems);
router.put('/api/v1/admin/menu-items/:menuItemId/plan/:planId/lock', verifyUser, verifyAdmin, updateMenuItemLock);
router.put('/api/v1/admin/menu-items/bulk-update', verifyUser, verifyAdmin, bulkUpdateMenuItems);

export default router;

