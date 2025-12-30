// src/routes/payment.routes.js
import { Router } from 'express';
import { createPaymentOrder, verifyPayment } from '../controllers/payment.controller.js';
import { verifyUser } from '../middleware/authMiddleware.js';

const router = Router();

// Create payment order
router.post('/api/v1/payment/create-order', verifyUser, createPaymentOrder);

// Verify payment and activate plan
router.post('/api/v1/payment/verify', verifyUser, verifyPayment);

export default router;

