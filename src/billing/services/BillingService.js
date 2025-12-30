// src/billing/services/BillingService.js
import { BILLING_STATUS, PAYMENT_STATUS } from "../constants/billing.constant.js";

function safeIsoFromUnix(unixSeconds) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000);
}

function extractProviderSubscriptionId(event) {
  const p = event?.payload || {};
  return (
    p?.subscription?.entity?.id ||
    p?.subscription?.id ||
    p?.invoice?.entity?.subscription_id ||
    p?.payment?.entity?.subscription_id ||
    null
  );
}

function mapEventToStatus(eventName) {
  const e = String(eventName || "").toLowerCase();

  if (e.includes("activated") || e.includes("paid") || e.includes("charged")) return BILLING_STATUS.ACTIVE;
  if (e.includes("failed") || e.includes("halted") || e.includes("past_due")) return BILLING_STATUS.PAST_DUE;
  if (e.includes("cancel")) return BILLING_STATUS.CANCELLED;
  if (e.includes("complete") || e.includes("expire")) return BILLING_STATUS.EXPIRED;

  return null; // unknown event -> no status change
}

export class BillingService {
  constructor({ provider, store, planCatalog = [] }) {
    this.provider = provider;
    this.store = store;
    this.planCatalog = planCatalog;
  }

  isConfigured() {
    return this.provider?.isConfigured() || false;
  }

  // ========== PLANS API ==========

  async listPlans() {
    return this.store.listPlans();
  }

  async getPlanById(planId) {
    return this.store.getPlanById(planId);
  }

  async getPlanBySlug(planSlug) {
    return this.store.getPlanBySlug(planSlug);
  }

  // ========== ORDERS API (One-time payments) ==========

  async createOrder({ userId, planId, billingCycle, customer, gstin, billingEmail }) {
    const plan = await this.store.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Calculate price based on billing cycle
    let amount = parseFloat(plan.price);
    if (billingCycle === 'yearly') {
      amount = plan.yearlyPrice ? parseFloat(plan.yearlyPrice) : parseFloat(plan.price) * 12;
    }

    // Convert to paise
    const amountPaise = Math.round(amount * 100);
    const receipt = `order_${planId}_${userId}_${Date.now()}`;

    // Create order in Razorpay
    const order = await this.provider.createOrder({
      amountPaise,
      currency: plan.currency || "INR",
      receipt,
      notes: {
        userId: String(userId),
        planId: String(planId),
        planSlug: plan.slug,
        planName: plan.name,
        billingCycle,
        gstin: gstin || '',
        billingEmail: billingEmail || customer?.email || ''
      }
    });

    // Log the payment attempt
    await this.store.createPaymentLog({
      userId,
      planId,
      razorpayOrderId: order.id,
      amount,
      currency: plan.currency || "INR",
      billingCycle,
      status: PAYMENT_STATUS.PENDING,
      metadata: { gstin, billingEmail }
    });

    // Get checkout configuration
    const checkout = this.provider.getOrderCheckoutConfig({
      orderId: order.id,
      amountPaise: order.amount,
      currency: order.currency,
      name: "Mini CRM 360",
      description: `${plan.name} - ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} Subscription`,
      customer
    });

    return { 
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }, 
      checkout,
      plan: { 
        id: plan.id,
        name: plan.name, 
        slug: plan.slug,
        price: amount 
      },
      keyId: this.provider.keyId
    };
  }

  async verifyPayment({ userId, orderId, paymentId, signature, planId, billingCycle }) {
    // Verify the signature
    const isValid = this.provider.verifyPaymentSignature({
      orderId,
      paymentId,
      signature
    });

    if (!isValid) {
      // Update payment log
      await this.store.updatePaymentLogByOrderId(orderId, {
        status: PAYMENT_STATUS.FAILED,
        errorMessage: "Invalid payment signature"
      });
      throw new Error("Invalid payment signature");
    }

    // Fetch payment details from Razorpay
    const payment = await this.provider.fetchPayment(paymentId);

    // Get plan
    const plan = await this.store.getPlanById(planId);
    if (!plan) {
      throw new Error("Plan not found");
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

    // Activate the user's plan
    const userPlan = await this.store.activateUserPlan({
      userId,
      planId,
      startDate,
      endDate,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId
    });

    // Update payment log
    await this.store.updatePaymentLogByOrderId(orderId, {
      status: PAYMENT_STATUS.COMPLETED,
      razorpayPaymentId: paymentId,
      paidAt: new Date()
    });

    // Create invoice record
    const invoice = await this.store.createInvoice({
      userId,
      planId,
      userPlanId: userPlan.id,
      amount: payment.amount / 100,
      currency: payment.currency,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      status: 'paid',
      paidAt: new Date(),
      billingCycle,
      description: `${plan.name} - ${billingCycle} subscription`
    });

    // Log webhook-like event for audit
    await this.store.logWebhook(
      `payment_${paymentId}`,
      "payment.captured.manual",
      {
        payment_id: paymentId,
        order_id: orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        contact: payment.contact
      }
    );

    return {
      verified: true,
      payment: {
        id: paymentId,
        orderId: orderId,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        status: payment.status
      },
      userPlan: {
        id: userPlan.id,
        planId: userPlan.planId,
        status: userPlan.status,
        startDate: userPlan.startDate,
        endDate: userPlan.endDate
      },
      invoice: invoice ? { id: invoice.id } : null
    };
  }

  // ========== SUBSCRIPTIONS API (Razorpay Recurring) ==========

  async createSubscription({ userId, planId, totalCount = 12, customer }) {
    const plan = await this.store.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }

    // Get or create Razorpay plan
    let razorpayPlanId = await this.store.getRazorpayPlanId(planId);
    
    if (!razorpayPlanId) {
      // Create plan in Razorpay
      const amountPaise = Math.round(parseFloat(plan.price) * 100);
      const rzpPlan = await this.provider.createPlan({
        name: plan.name,
        amountPaise,
        currency: plan.currency || "INR",
        interval: 1,
        period: "monthly",
        description: plan.description || `${plan.name} monthly subscription`
      });
      
      // Store the mapping
      razorpayPlanId = rzpPlan.id;
      await this.store.setRazorpayPlanId(planId, razorpayPlanId);
    }

    // Create subscription in Razorpay
    const subscription = await this.provider.createSubscription({
      planId: razorpayPlanId,
      totalCount,
      notes: {
        userId: String(userId),
        planId: String(planId),
        planName: plan.name
      }
    });

    // Store subscription in database
    const userSubscription = await this.store.createSubscription({
      userId,
      planId,
      razorpaySubscriptionId: subscription.id,
      status: BILLING_STATUS.PENDING,
      totalCount,
      currentCycleStart: new Date(),
      currentCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Get checkout config
    const checkout = this.provider.getCheckoutConfig({
      providerSubscriptionId: subscription.id,
      name: "Mini CRM 360",
      description: `${plan.name} subscription`
    });

    return {
      subscription: userSubscription,
      razorpaySubscription: subscription,
      checkout
    };
  }

  async cancelSubscription({ userId, subscriptionId, cancelAtPeriodEnd = true }) {
    const subscription = await this.store.getSubscriptionById(subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }
    if (String(subscription.userId) !== String(userId)) {
      throw new Error("Forbidden");
    }

    // Cancel in Razorpay if there's a provider subscription
    if (subscription.razorpaySubscriptionId) {
      await this.provider.cancelSubscription(subscription.razorpaySubscriptionId, {
        cancelAtCycleEnd: cancelAtPeriodEnd
      });
    }

    // Update local subscription
    await this.store.updateSubscription(subscriptionId, {
      status: cancelAtPeriodEnd ? BILLING_STATUS.ACTIVE : BILLING_STATUS.CANCELLED,
      cancelAtPeriodEnd,
      cancelledAt: cancelAtPeriodEnd ? null : new Date()
    });

    return { cancelled: true, cancelAtPeriodEnd };
  }

  async getMySubscription({ userId }) {
    return this.store.getActiveSubscription(userId);
  }

  async getMyCurrentPlan({ userId }) {
    return this.store.getUserCurrentPlan(userId);
  }

  // ========== WEBHOOKS ==========

  async handleWebhook({ rawBody, signature }) {
    const ok = this.provider.verifyWebhookSignature(rawBody, signature);
    if (!ok) {
      throw new Error("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventName = event?.event || "unknown";
    const eventId = event?.id || event?.event_id || `${eventName}:${event?.created_at || Date.now()}`;

    // Check if already processed
    if (await this.store.hasProcessedEvent(eventId)) {
      return { ignored: true, event: eventName };
    }

    let result = { processed: true, event: eventName };

    // Handle different event types
    switch (eventName) {
      case "payment.captured":
        await this.handlePaymentCaptured(event);
        break;
      
      case "payment.failed":
        await this.handlePaymentFailed(event);
        break;
      
      case "subscription.activated":
      case "subscription.charged":
        await this.handleSubscriptionActivated(event);
        break;
      
      case "subscription.cancelled":
        await this.handleSubscriptionCancelled(event);
        break;
      
      case "subscription.halted":
      case "subscription.pending":
        await this.handleSubscriptionPending(event);
        break;
      
      default:
        console.log(`[Webhook] Unhandled event: ${eventName}`);
    }

    // Mark event as processed
    await this.store.markEventProcessed(eventId, eventName, event);

    return result;
  }

  async handlePaymentCaptured(event) {
    const payment = event?.payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id;
    const paymentId = payment.id;
    const notes = payment.notes || {};

    // Update payment log if exists
    await this.store.updatePaymentLogByOrderId(orderId, {
      status: PAYMENT_STATUS.COMPLETED,
      razorpayPaymentId: paymentId,
      paidAt: new Date()
    });

    // If this is for a plan purchase, activate it
    if (notes.planId && notes.userId) {
      const existingPlan = await this.store.getUserPlanByOrderId(orderId);
      if (!existingPlan) {
        // Plan not yet activated (webhook came before verification)
        const plan = await this.store.getPlanById(notes.planId);
        if (plan) {
          const startDate = new Date();
          let endDate = new Date(startDate);
          if (notes.billingCycle === 'yearly') {
            endDate.setFullYear(endDate.getFullYear() + 1);
          } else {
            endDate.setMonth(endDate.getMonth() + 1);
          }

          await this.store.activateUserPlan({
            userId: notes.userId,
            planId: notes.planId,
            startDate,
            endDate,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId
          });
        }
      }
    }
  }

  async handlePaymentFailed(event) {
    const payment = event?.payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id;
    await this.store.updatePaymentLogByOrderId(orderId, {
      status: PAYMENT_STATUS.FAILED,
      errorMessage: payment.error_description || "Payment failed"
    });
  }

  async handleSubscriptionActivated(event) {
    const subscription = event?.payload?.subscription?.entity;
    if (!subscription) return;

    const subscriptionId = subscription.id;
    await this.store.updateSubscriptionByRazorpayId(subscriptionId, {
      status: BILLING_STATUS.ACTIVE,
      currentCycleStart: safeIsoFromUnix(subscription.current_start),
      currentCycleEnd: safeIsoFromUnix(subscription.current_end)
    });

    // Also activate the user plan if not already
    const notes = subscription.notes || {};
    if (notes.userId && notes.planId) {
      await this.store.activateUserPlan({
        userId: notes.userId,
        planId: notes.planId,
        startDate: safeIsoFromUnix(subscription.current_start) || new Date(),
        endDate: safeIsoFromUnix(subscription.current_end),
        razorpaySubscriptionId: subscriptionId
      });
    }
  }

  async handleSubscriptionCancelled(event) {
    const subscription = event?.payload?.subscription?.entity;
    if (!subscription) return;

    await this.store.updateSubscriptionByRazorpayId(subscription.id, {
      status: BILLING_STATUS.CANCELLED,
      cancelledAt: new Date()
    });
  }

  async handleSubscriptionPending(event) {
    const subscription = event?.payload?.subscription?.entity;
    if (!subscription) return;

    await this.store.updateSubscriptionByRazorpayId(subscription.id, {
      status: BILLING_STATUS.PAST_DUE
    });
  }

  // ========== INVOICES & HISTORY ==========

  async getUserInvoices({ userId, limit = 20 }) {
    return this.store.getUserInvoices(userId, limit);
  }

  async getInvoiceById(invoiceId) {
    return this.store.getInvoiceById(invoiceId);
  }
}
