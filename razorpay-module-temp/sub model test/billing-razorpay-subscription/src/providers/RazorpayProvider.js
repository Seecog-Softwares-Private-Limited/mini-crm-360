import Razorpay from "razorpay";
import crypto from "crypto";

export class RazorpayProvider {
  constructor({ keyId, keySecret, webhookSecret }) {
    if (!keyId || !keySecret) throw new Error("Razorpay keys missing");
    if (!webhookSecret) throw new Error("Razorpay webhook secret missing");

    this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.keyId = keyId;
    this.keySecret = keySecret;
    this.webhookSecret = webhookSecret;
  }

  // ========== ORDERS API (for one-time payments) ==========
  
  async createOrder({ amountPaise, currency = "INR", receipt, notes = {} }) {
    return this.client.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes
    });
  }

  async fetchOrder(orderId) {
    return this.client.orders.fetch(orderId);
  }

  async fetchPayment(paymentId) {
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
    return this.client.plans.create({
      period,
      interval,
      item: { name, amount: amountPaise, currency, description }
    });
  }

  async createSubscription({ planId, totalCount = 12, notes = {} }) {
    return this.client.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount,
      notes
    });
  }

  async cancelSubscription(providerSubscriptionId, { cancelAtCycleEnd = true } = {}) {
    return this.client.subscriptions.cancel(providerSubscriptionId, !!cancelAtCycleEnd);
  }

  // ========== WEBHOOKS ==========

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
      description
    };
  }
}
