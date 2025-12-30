import express from "express";
import { RazorpayProvider } from "./providers/RazorpayProvider.js";
import { BillingService } from "./services/BillingService.js";

export function createBillingRouter({ razorpay, store, getUserId, planCatalog = [] }) {
  if (!razorpay?.keyId || !razorpay?.keySecret) throw new Error("Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET");
  if (!razorpay?.webhookSecret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  if (!store) throw new Error("Missing store");
  if (typeof getUserId !== "function") throw new Error("getUserId(req) must be a function");

  const provider = new RazorpayProvider({
    keyId: razorpay.keyId,
    keySecret: razorpay.keySecret,
    webhookSecret: razorpay.webhookSecret
  });

  const billing = new BillingService({ provider, store, planCatalog });
  const router = express.Router();

  // ✅ WEBHOOK FIRST (RAW BODY)
  router.post("/billing/webhook/razorpay", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"];
      const handled = await billing.handleWebhook({ rawBody: req.body, signature });
      res.json({ ok: true, handled });
    } catch (e) {
      res.status(400).json({ ok: false, message: e.message || "Webhook error" });
    }
  });

  // ✅ JSON parsing for all other billing routes
  router.use(express.json());

  router.get("/billing/plans", async (req, res) => {
    res.json({ ok: true, plans: await billing.listPlans() });
  });

  // ========== ORDERS API (One-time payments - works without Subscriptions feature) ==========

  // Step 1: Create order for payment
  router.post("/billing/orders", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { planCode, customer } = req.body || {};
      
      if (!planCode) {
        return res.status(400).json({ ok: false, message: "planCode is required" });
      }
      if (!customer?.name || !customer?.email || !customer?.contact) {
        return res.status(400).json({ ok: false, message: "customer.name, customer.email, and customer.contact are required" });
      }

      const result = await billing.createOrder({ userId, planCode, customer });
      res.json({ ok: true, ...result });
    } catch (e) {
      console.error("[/billing/orders] Error:", e);
      const errMsg = e?.error?.description || e?.message || "Failed to create order";
      res.status(400).json({ ok: false, message: errMsg });
    }
  });

  // Step 2: Verify payment after Razorpay checkout success
  router.post("/billing/orders/:orderId/verify", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { orderId } = req.params;
      const { razorpay_payment_id, razorpay_signature } = req.body || {};

      if (!razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ ok: false, message: "razorpay_payment_id and razorpay_signature are required" });
      }

      const result = await billing.verifyPayment({
        userId,
        orderId,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature
      });
      res.json({ ok: true, ...result });
    } catch (e) {
      console.error("[/billing/orders/verify] Error:", e);
      const errMsg = e?.error?.description || e?.message || "Payment verification failed";
      res.status(400).json({ ok: false, message: errMsg });
    }
  });

  // ========== SUBSCRIPTIONS API (requires Razorpay Subscriptions enabled) ==========

  router.post("/billing/admin/sync-plans", async (req, res) => {
    res.json({ ok: true, synced: await billing.syncPlansToProvider() });
  });

  router.post("/billing/subscriptions", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { planCode, totalCount = 12 } = req.body || {};
      if (!planCode) return res.status(400).json({ ok: false, message: "planCode is required" });

      const out = await billing.createSubscription({ userId, planCode, totalCount });
      res.json({ ok: true, ...out });
    } catch (e) {
      console.error("[/billing/subscriptions] Error:", e);
      const errMsg = e?.error?.description || e?.message || JSON.stringify(e) || "Create subscription failed";
      res.status(400).json({ ok: false, message: errMsg });
    }
  });

  router.post("/billing/subscriptions/:id/cancel", async (req, res) => {
    try {
      const userId = getUserId(req);
      const { cancelAtPeriodEnd = true } = req.body || {};
      const out = await billing.cancelSubscription({
        userId,
        subscriptionId: req.params.id,
        cancelAtPeriodEnd
      });
      res.json({ ok: true, ...out });
    } catch (e) {
      res.status(400).json({ ok: false, message: e.message || "Cancel failed" });
    }
  });

  router.get("/billing/subscriptions/me", async (req, res) => {
    const userId = getUserId(req);
    res.json({ ok: true, subscription: await billing.getMySubscription({ userId }) });
  });

  return router;
}
