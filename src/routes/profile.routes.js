// src/routes/profile.routes.js
import { Router } from 'express';
import multer from 'multer';
import {
  renderProfilePage,
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  changePassword,
  getActiveSessions,
  logoutSession,
  getWorkspaceInfo,
  updateNotificationPreferences,
  getActivityLogs,
  getBillingInfo
} from '../controllers/profile.controller.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = Router();

// Configure multer for avatar upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Frontend route - must be before API routes to avoid conflicts
router.get('/profile', verifyUser, renderProfilePage);

// API routes
router.get('/api/v1/profile', verifyUser, getProfile);
router.put('/api/v1/profile', verifyUser, updateProfile);
router.post('/api/v1/profile/avatar', verifyUser, upload.single('avatar'), uploadAvatar);
router.delete('/api/v1/profile/avatar', verifyUser, removeAvatar);
router.post('/api/v1/profile/change-password', verifyUser, changePassword);
router.get('/api/v1/profile/sessions', verifyUser, getActiveSessions);
router.delete('/api/v1/profile/sessions/:sessionId', verifyUser, logoutSession);
router.get('/api/v1/profile/workspace', verifyUser, getWorkspaceInfo);
router.put('/api/v1/profile/notifications', verifyUser, updateNotificationPreferences);
router.get('/api/v1/profile/activity', verifyUser, getActivityLogs);
router.get('/api/v1/profile/billing', verifyUser, getBillingInfo);

export default router;

