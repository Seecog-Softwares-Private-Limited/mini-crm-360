// src/billing/providers/RazorpayProvider.js
import Razorpay from "razorpay";
import crypto from "crypto";

export class RazorpayProvider {
  constructor({ keyId, keySecret, webhookSecret }) {
    if (!keyId || !keySecret) {
      console.warn("⚠️ Razorpay keys not configured. Payment functionality will be limited.");
      this.client = null;
      this.keyId = keyId;
      this.keySecret = keySecret;
      this.webhookSecret = webhookSecret;
      return;
    }

    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
  }

  isConfigured() {
    return this.client !== null;
  }

  // ========== ORDERS API (for one-time payments) ==========
  
  async createOrder({ amountPaise, currency = "INR", receipt, notes = {} }) {
    if (!this.client) throw new Error("Razorpay not configured");
    return this.client.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes
    });
  }

  async fetchOrder(orderId) {
    if (!this.client) throw new Error("Razorpay not configured");
    return this.client.orders.fetch(orderId);
  }

  async fetchPayment(paymentId) {
    if (!this.client) throw new Error("Razorpay not configured");
    return this.client.payments.fetch(paymentId);
  }

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", this.keySecret)
      .update(body)
      .digest("hex");
    return expectedSignature === signature;
  }

  getOrderCheckoutConfig({ orderId, amountPaise, currency = "INR", name, description, customer = {} }) {
    return {
      key: this.keyId,
      order_id: orderId,
      amount: amountPaise,
      currency,
      name,
      description,
      prefill: {
        name: customer.name || "",
        email: customer.email || "",
        contact: customer.contact || ""
      }
    };
  }

  // ========== SUBSCRIPTIONS API (requires Razorpay Subscriptions enabled) ==========

  async createPlan({ name, amountPaise, currency = "INR", interval = 1, period = "monthly", description = "" }) {
    if (!this.client) throw new Error("Razorpay not configured");
    return this.client.plans.create({
      period,
      interval,
      item: { name, amount: amountPaise, currency, description }
    });
  }

  async createSubscription({ planId, totalCount = 12, notes = {}, customerId = null }) {
    if (!this.client) throw new Error("Razorpay not configured");
    const params = {
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount,
      notes
    };
    if (customerId) {
      params.customer_id = customerId;
    }
    return this.client.subscriptions.create(params);
  }

  async cancelSubscription(providerSubscriptionId, { cancelAtCycleEnd = true } = {}) {
    if (!this.client) throw new Error("Razorpay not configured");
    return this.client.subscriptions.cancel(providerSubscriptionId, !!cancelAtCycleEnd);
  }

  async fetchSubscription(subscriptionId) {
    if (!this.client) throw new Error("Razorpay not configured");
    return this.client.subscriptions.fetch(subscriptionId);
  }

  // ========== WEBHOOKS ==========

  verifyWebhookSignature(rawBodyBuffer, signature) {
    if (!signature || !rawBodyBuffer || !this.webhookSecret) return false;
    const expected = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(rawBodyBuffer)
      .digest("hex");
    return expected === signature;
  }

  getCheckoutConfig({ providerSubscriptionId, name = "Mini CRM 360", description = "Subscription" }) {
    return {
      key: this.keyId,
      subscription_id: providerSubscriptionId,
      name,
      description
    };
  }
}
