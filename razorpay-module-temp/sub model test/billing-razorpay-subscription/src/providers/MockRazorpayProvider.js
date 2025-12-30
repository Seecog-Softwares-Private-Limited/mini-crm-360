/**
 * MockRazorpayProvider - Simulates Razorpay Subscription API for development/testing
 * when the actual Razorpay account doesn't have Subscriptions enabled.
 * 
 * This allows the full flow to work locally without requiring Razorpay Subscriptions feature.
 */

import crypto from "crypto";

export class MockRazorpayProvider {
  constructor({ keyId, keySecret, webhookSecret }) {
    if (!keyId || !keySecret) throw new Error("Razorpay keys missing");
    if (!webhookSecret) throw new Error("Razorpay webhook secret missing");

    this.keyId = keyId;
    this.webhookSecret = webhookSecret;
    
    // In-memory storage for mock data
    this.plans = new Map();
    this.subscriptions = new Map();
    
    console.log("⚠️  Using MockRazorpayProvider - Subscriptions are simulated locally");
  }

  async createPlan({ name, amountPaise, currency = "INR", interval = 1, period = "monthly", description = "" }) {
    const id = `plan_mock_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const plan = {
      id,
      entity: "plan",
      interval,
      period,
      item: {
        id: `item_${id}`,
        active: true,
        name,
        description,
        amount: amountPaise,
        unit_amount: amountPaise,
        currency,
        type: "plan",
        created_at: Math.floor(Date.now() / 1000)
      },
      notes: {},
      created_at: Math.floor(Date.now() / 1000)
    };
    
    this.plans.set(id, plan);
    console.log(`[MockRazorpay] Plan created: ${id}`);
    return plan;
  }

  async createSubscription({ planId, totalCount = 12, notes = {} }) {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw { statusCode: 400, error: { code: "BAD_REQUEST_ERROR", description: `Plan ${planId} not found` } };
    }
    
    const id = `sub_mock_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const now = Math.floor(Date.now() / 1000);
    
    const subscription = {
      id,
      entity: "subscription",
      plan_id: planId,
      status: "created",
      current_start: null,
      current_end: null,
      ended_at: null,
      quantity: 1,
      notes,
      charge_at: now + 60, // Charge in 1 minute
      start_at: now,
      end_at: now + (totalCount * 30 * 24 * 60 * 60), // Rough end date
      auth_attempts: 0,
      total_count: totalCount,
      paid_count: 0,
      customer_notify: true,
      created_at: now,
      short_url: `https://rzp.io/mock/${id}`,
      has_scheduled_changes: false,
      change_scheduled_at: null,
      source: "api",
      remaining_count: totalCount
    };
    
    this.subscriptions.set(id, subscription);
    console.log(`[MockRazorpay] Subscription created: ${id}`);
    return subscription;
  }

  async cancelSubscription(providerSubscriptionId, { cancelAtCycleEnd = true } = {}) {
    const sub = this.subscriptions.get(providerSubscriptionId);
    if (!sub) {
      throw { statusCode: 400, error: { code: "BAD_REQUEST_ERROR", description: `Subscription ${providerSubscriptionId} not found` } };
    }
    
    sub.status = cancelAtCycleEnd ? "pending_cancellation" : "cancelled";
    sub.ended_at = cancelAtCycleEnd ? null : Math.floor(Date.now() / 1000);
    
    console.log(`[MockRazorpay] Subscription cancelled: ${providerSubscriptionId}`);
    return sub;
  }

  verifyWebhookSignature(rawBodyBuffer, signature) {
    if (!signature || !rawBodyBuffer) return false;
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBodyBuffer)
      .digest("hex");
    return expected === signature;
  }

  getCheckoutConfig({ providerSubscriptionId, name = "Your App", description = "Subscription" }) {
    return {
      key: this.keyId,
      subscription_id: providerSubscriptionId,
      name,
      description,
      _mock: true // Indicates this is a mock checkout
    };
  }
  
  // Helper method to simulate payment for a subscription (for testing)
  async simulatePayment(subscriptionId) {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }
    
    const now = Math.floor(Date.now() / 1000);
    sub.status = "active";
    sub.current_start = now;
    sub.current_end = now + (30 * 24 * 60 * 60); // 30 days
    sub.paid_count = (sub.paid_count || 0) + 1;
    sub.remaining_count = sub.total_count - sub.paid_count;
    
    console.log(`[MockRazorpay] Payment simulated for subscription: ${subscriptionId}`);
    return sub;
  }
}
