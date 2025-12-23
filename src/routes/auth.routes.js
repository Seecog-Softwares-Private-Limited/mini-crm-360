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

export default router;

