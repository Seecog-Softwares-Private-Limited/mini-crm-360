// src/controllers/payment.controller.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Plan } from '../models/Plan.js';
import { UserPlan } from '../models/UserPlan.js';
import { getUserPlan } from '../utils/plan.util.js';

// Initialize Razorpay (only if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('⚠️ Razorpay keys not configured. Payment functionality will not work.');
}

// Create payment order
export const createPaymentOrder = asyncHandler(async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured. Please contact support.'
      });
    }

    const { planId, billingCycle, gstin, billingEmail } = req.body;
    const userId = req.user.id;

    if (!planId || !billingCycle) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and billing cycle are required'
      });
    }

    // Get plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Calculate amount based on billing cycle
    let amount = parseFloat(plan.price);
    if (billingCycle === 'yearly') {
      amount = plan.yearlyPrice ? parseFloat(plan.yearlyPrice) : parseFloat(plan.price) * 12;
    }

    // Convert to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: plan.currency || 'INR',
      receipt: `plan_${planId}_${userId}_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        planId: planId.toString(),
        planSlug: plan.slug,
        planName: plan.name,
        billingCycle: billingCycle,
        gstin: gstin || '',
        billingEmail: billingEmail || req.user.email
      }
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json(
      new ApiResponse(200, {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }, 'Payment order created successfully')
    );

  } catch (error) {
    console.error('Error creating payment order:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
});

// Verify payment and update user plan
export const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification data is incomplete'
      });
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Get plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Calculate end date based on billing cycle
    const startDate = new Date();
    let endDate = null;
    if (billingCycle === 'monthly') {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Deactivate current plan
    await UserPlan.update(
      { isCurrent: false },
      { where: { userId, isCurrent: true } }
    );

    // Create new user plan
    const userPlan = await UserPlan.create({
      userId,
      planId: plan.id,
      status: 'active',
      startDate,
      endDate,
      isCurrent: true
    });

    // Get updated plan details with features
    const updatedPlan = await getUserPlan(userId);

    return res.status(200).json(
      new ApiResponse(200, {
        plan: updatedPlan,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }, 'Payment verified and plan activated successfully')
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

