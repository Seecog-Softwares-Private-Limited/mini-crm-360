// src/controllers/payment.controller.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Plan } from '../models/Plan.js';
import { UserPlan } from '../models/UserPlan.js';
import { getUserPlan } from '../utils/plan.util.js';

// Import billing store for logging (optional enhancement)
let billingStore = null;
try {
  const { SequelizeStore } = await import('../billing/store/SequelizeStore.js');
  billingStore = new SequelizeStore();
  billingStore.initialize().catch(err => console.warn('Billing store init warning:', err.message));
} catch (e) {
  console.warn('Billing store not available:', e.message);
}

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

    // Log payment attempt to billing store (for audit trail)
    if (billingStore) {
      try {
        await billingStore.createPaymentLog({
          userId,
          planId,
          razorpayOrderId: order.id,
          amount,
          currency: plan.currency || 'INR',
          billingCycle,
          status: 'pending',
          metadata: { gstin, billingEmail }
        });
      } catch (logError) {
        console.warn('Failed to log payment attempt:', logError.message);
      }
    }

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

    console.log('[Payment Verify] Starting verification:', { razorpay_order_id, razorpay_payment_id, planId, billingCycle, userId });

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      console.log('[Payment Verify] Missing required fields');
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

    console.log('[Payment Verify] Signature check:', { match: generatedSignature === razorpay_signature });

    if (generatedSignature !== razorpay_signature) {
      console.log('[Payment Verify] Signature mismatch!');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Get plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      console.log('[Payment Verify] Plan not found:', planId);
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    console.log('[Payment Verify] Plan found:', plan.name);

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

    console.log('[Payment Verify] Deactivating current plan for user:', userId);

    // Deactivate current plan
    await UserPlan.update(
      { isCurrent: false },
      { where: { userId, isCurrent: true } }
    );

    console.log('[Payment Verify] Creating new user plan');

    // Create new user plan
    const userPlan = await UserPlan.create({
      userId,
      planId: plan.id,
      status: 'active',
      startDate,
      endDate,
      isCurrent: true
    });

    console.log('[Payment Verify] User plan created:', userPlan.id);

    // Log successful payment and create invoice in billing store
    if (billingStore) {
      try {
        // Update payment log
        await billingStore.updatePaymentLogByOrderId(razorpay_order_id, {
          status: 'completed',
          razorpayPaymentId: razorpay_payment_id,
          paidAt: startDate
        });

        // Create invoice with proper due date (use same endDate as user plan)
        const amount = billingCycle === 'yearly' 
          ? (plan.yearlyPrice || plan.price * 12) 
          : plan.price;
        
        await billingStore.createInvoice({
          userId,
          planId: plan.id,
          userPlanId: userPlan.id,
          amount: parseFloat(amount),
          currency: plan.currency || 'INR',
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          status: 'paid',
          paidAt: startDate,
          dueDate: endDate,
          billingCycle,
          description: `${plan.name} - ${billingCycle} subscription`
        });

        // Create subscription record (for tracking purposes)
        const totalCount = billingCycle === 'yearly' ? 1 : 12; // yearly = 1 payment/year, monthly = 12/year
        await billingStore.createSubscription({
          userId,
          planId: plan.id,
          razorpaySubscriptionId: `manual_${razorpay_order_id}`, // Mark as manual (not Razorpay auto-recurring)
          status: 'active',
          totalCount,
          currentCycleStart: startDate,
          currentCycleEnd: endDate
        });

        // Create/update plan mapping (maps internal plan to a reference ID)
        await billingStore.setRazorpayPlanId(plan.id, `plan_${plan.slug}_${billingCycle}`);

        // Log webhook-style event for audit trail
        await billingStore.logWebhook(
          `payment_${razorpay_payment_id}`,
          'payment.captured',
          {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            planId: plan.id,
            userId,
            amount: parseFloat(amount),
            billingCycle,
            timestamp: startDate.toISOString()
          }
        );

        console.log('[Payment Verify] All billing records created successfully');
      } catch (logError) {
        console.warn('Failed to log payment completion:', logError.message);
      }
    }

    // Get updated plan details with features
    const updatedPlan = await getUserPlan(userId);

    console.log('[Payment Verify] Success! Plan activated:', plan.name);

    return res.status(200).json(
      new ApiResponse(200, {
        plan: updatedPlan,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }, 'Payment verified and plan activated successfully')
    );

  } catch (error) {
    console.error('[Payment Verify] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
});

