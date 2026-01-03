import express from 'express';
import { loginUser, logoutUser } from '../controllers/user/login.js';
import register, { checkEmailExists } from '../controllers/user/register.js';
import { verifyUser } from '../middleware/authMiddleware.js';
import { refresh } from '../controllers/user/refreshToken.js';
import { activateAccount, resendActivationEmail } from '../controllers/user/activateAccount.js';


const router = express.Router();

router.get('/check-email', checkEmailExists);
router.post('/register', register);
router.post('/login', loginUser);
router.post("/refresh", refresh);
router.post('/logout', verifyUser, logoutUser);
router.post('/resend-activation', resendActivationEmail);

export default router;