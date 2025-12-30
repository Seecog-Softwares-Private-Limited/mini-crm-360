// src/billing/router.js
import express from "express";
import { verifyUser } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export function createBillingRouter({ billingService }) {
  const router = express.Router();

  // ✅ WEBHOOK FIRST (RAW BODY) - No auth required
  router.post(
    "/api/v1/billing/webhook/razorpay",
    express.raw({ type: "application/json" }),
    asyncHandler(async (req, res) => {
      try {
        const signature = req.headers["x-razorpay-signature"];
        const result = await billingService.handleWebhook({ 
          rawBody: req.body, 
          signature 
        });
        res.json({ ok: true, ...result });
      } catch (error) {
        console.error("[Webhook Error]:", error.message);
        res.status(400).json({ ok: false, message: error.message || "Webhook error" });
      }
    })
  );

  // ========== PLANS API ==========

  // Get all active plans
  router.get(
    "/api/v1/billing/plans",
    verifyUser,
    asyncHandler(async (req, res) => {
      const plans = await billingService.listPlans();
      return res.status(200).json(
        new ApiResponse(200, plans, "Plans fetched successfully")
      );
    })
  );

  // ========== ORDERS API (One-time payments) ==========

  // Create payment order
  router.post(
    "/api/v1/billing/orders",
    verifyUser,
    asyncHandler(async (req, res) => {
      if (!billingService.isConfigured()) {
        return res.status(500).json({
          success: false,
          message: "Payment gateway not configured. Please contact support."
        });
      }

      const { planId, billingCycle, gstin, billingEmail } = req.body;
      const userId = req.user.id;

      if (!planId || !billingCycle) {
        return res.status(400).json({
          success: false,
          message: "Plan ID and billing cycle are required"
        });
      }

      const customer = {
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        email: billingEmail || req.user.email,
        contact: req.user.phone || ""
      };

      const result = await billingService.createOrder({
        userId,
        planId,
        billingCycle,
        customer,
        gstin,
        billingEmail
      });

      return res.status(200).json(
        new ApiResponse(200, {
          orderId: result.order.id,
          amount: result.order.amount,
          currency: result.order.currency,
          keyId: result.keyId,
          checkout: result.checkout,
          plan: result.plan
        }, "Payment order created successfully")
      );
    })
  );

  // Verify payment
  router.post(
    "/api/v1/billing/orders/:orderId/verify",
    verifyUser,
    asyncHandler(async (req, res) => {
      const { orderId } = req.params;
      const { razorpay_payment_id, razorpay_signature, planId, billingCycle } = req.body;
      const userId = req.user.id;

      if (!razorpay_payment_id || !razorpay_signature || !planId) {
        return res.status(400).json({
          success: false,
          message: "Payment verification data is incomplete"
        });
      }

      const result = await billingService.verifyPayment({
        userId,
        orderId,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        planId,
        billingCycle
      });

      return res.status(200).json(
        new ApiResponse(200, result, "Payment verified and plan activated successfully")
      );
    })
  );

  // ========== SUBSCRIPTIONS API (Razorpay recurring) ==========

  // Create subscription
  router.post(
    "/api/v1/billing/subscriptions",
    verifyUser,
    asyncHandler(async (req, res) => {
      if (!billingService.isConfigured()) {
        return res.status(500).json({
          success: false,
          message: "Payment gateway not configured. Please contact support."
        });
      }

      const { planId, totalCount = 12 } = req.body;
      const userId = req.user.id;

      if (!planId) {
        return res.status(400).json({
          success: false,
          message: "Plan ID is required"
        });
      }

      const customer = {
        name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        email: req.user.email,
        contact: req.user.phone || ""
      };

      const result = await billingService.createSubscription({
        userId,
        planId,
        totalCount,
        customer
      });

      return res.status(200).json(
        new ApiResponse(200, result, "Subscription created successfully")
      );
    })
  );

  // Get current subscription
  router.get(
    "/api/v1/billing/subscriptions/me",
    verifyUser,
    asyncHandler(async (req, res) => {
      const userId = req.user.id;
      const subscription = await billingService.getMySubscription({ userId });
      return res.status(200).json(
        new ApiResponse(200, { subscription }, "Subscription fetched successfully")
      );
    })
  );

  // Cancel subscription
  router.post(
    "/api/v1/billing/subscriptions/:id/cancel",
    verifyUser,
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { cancelAtPeriodEnd = true } = req.body;
      const userId = req.user.id;

      const result = await billingService.cancelSubscription({
        userId,
        subscriptionId: id,
        cancelAtPeriodEnd
      });

      return res.status(200).json(
        new ApiResponse(200, result, "Subscription cancelled successfully")
      );
    })
  );

  // ========== USER PLAN API ==========

  // Get current plan
  router.get(
    "/api/v1/billing/my-plan",
    verifyUser,
    asyncHandler(async (req, res) => {
      const userId = req.user.id;
      const userPlan = await billingService.getMyCurrentPlan({ userId });
      return res.status(200).json(
        new ApiResponse(200, { userPlan }, "Current plan fetched successfully")
      );
    })
  );

  // ========== INVOICES API ==========

  // Get user invoices
  router.get(
    "/api/v1/billing/invoices",
    verifyUser,
    asyncHandler(async (req, res) => {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;
      const invoices = await billingService.getUserInvoices({ userId, limit });
      return res.status(200).json(
        new ApiResponse(200, { invoices }, "Invoices fetched successfully")
      );
    })
  );

  // Get invoice by ID
  router.get(
    "/api/v1/billing/invoices/:id",
    verifyUser,
    asyncHandler(async (req, res) => {
      const invoice = await billingService.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: "Invoice not found"
        });
      }
      return res.status(200).json(
        new ApiResponse(200, { invoice }, "Invoice fetched successfully")
      );
    })
  );

  return router;
}
