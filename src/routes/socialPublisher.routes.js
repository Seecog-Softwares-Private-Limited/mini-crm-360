// src/routes/socialPublisher.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyUser } from '../middleware/authMiddleware.js';
import * as socialPublisherController from '../controllers/socialPublisher.controller.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads/media');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `media-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Page route
router.get('/social-publisher', verifyUser, socialPublisherController.renderSocialPublisherPage);

// Social Accounts
router.get('/api/v1/social/accounts', verifyUser, socialPublisherController.getSocialAccounts);
router.post('/api/v1/social/accounts', verifyUser, socialPublisherController.createSocialAccount);
router.put('/api/v1/social/accounts/:id', verifyUser, socialPublisherController.updateSocialAccount);
router.delete('/api/v1/social/accounts/:id', verifyUser, socialPublisherController.deleteSocialAccount);

// Social Posts
router.get('/api/v1/social/posts', verifyUser, socialPublisherController.getSocialPosts);
router.get('/api/v1/social/posts/:id', verifyUser, socialPublisherController.getPostDetails);
router.post('/api/v1/social/posts', verifyUser, socialPublisherController.createSocialPost);
router.put('/api/v1/social/posts/:id', verifyUser, socialPublisherController.updateSocialPost);
router.delete('/api/v1/social/posts/:id', verifyUser, socialPublisherController.deleteSocialPost);
router.post('/api/v1/social/posts/channels/:postChannelId/retry', verifyUser, socialPublisherController.retryFailedPost);

// Templates
router.get('/api/v1/social/templates', verifyUser, socialPublisherController.getSocialTemplates);
router.post('/api/v1/social/templates', verifyUser, socialPublisherController.createSocialTemplate);

// Media
router.post('/api/v1/social/media', verifyUser, upload.single('file'), socialPublisherController.uploadMedia);
router.get('/api/v1/social/media', verifyUser, socialPublisherController.getMediaAssets);

// Platform limits
router.get('/api/v1/social/platform-limits', verifyUser, socialPublisherController.getPlatformLimits);

export default router;

