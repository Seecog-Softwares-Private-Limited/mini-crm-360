import express from 'express';
import { 
  googleAuth, 
  googleCallback, 
  instagramAuth, 
  instagramCallback,
  facebookAuth,
  facebookCallback,
  githubAuth,
  githubCallback,
  linkedinAuth,
  linkedinCallback,
  twitterAuth,
  twitterCallback
} from '../controllers/auth/socialAuth.controller.js';
import { forgotPassword } from '../controllers/auth/forgotPassword.controller.js';
import { resetPassword, verifyResetToken } from '../controllers/auth/resetPassword.controller.js';

const router = express.Router();

// Google OAuth
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Instagram OAuth
router.get('/instagram', instagramAuth);
router.get('/instagram/callback', instagramCallback);

// Facebook OAuth
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookCallback);

// GitHub OAuth
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback);

// LinkedIn OAuth
router.get('/linkedin', linkedinAuth);
router.get('/linkedin/callback', linkedinCallback);

// Twitter OAuth
router.get('/twitter', twitterAuth);
router.get('/twitter/callback', twitterCallback);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-reset-token', verifyResetToken);

// Test Email Route (for debugging)
import { testEmail } from '../controllers/auth/testEmail.controller.js';
router.post('/test-email', testEmail);

export default router;

