import { BILLING_STATUS } from "../constants/billing.constant.js";

function safeIsoFromUnix(unixSeconds) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
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

  async listPlans() {
    const stored = await this.store.listPlans();
    const map = new Map(stored.map(p => [p.code, p]));
    return this.planCatalog.map(p => ({
      ...p,
      providerPlanId: map.get(p.code)?.providerPlanId || null
    }));
  }

  async syncPlansToProvider() {
    const results = [];

    for (const p of this.planCatalog) {
      const existing = await this.store.getPlanByCode(p.code);
      if (existing?.providerPlanId) {
        results.push({ code: p.code, providerPlanId: existing.providerPlanId, created: false });
        continue;
      }

      try {
        console.log(`[syncPlansToProvider] Creating plan in Razorpay:`, p.code);
        const created = await this.provider.createPlan({
          name: p.name,
          amountPaise: p.amountPaise,
          currency: p.currency || "INR",
          interval: p.interval || 1,
          period: "monthly",
          description: `Internal plan code: ${p.code}`
        });
        console.log(`[syncPlansToProvider] Plan created:`, created.id);

        await this.store.upsertPlan({
          code: p.code,
          name: p.name,
          amountPaise: p.amountPaise,
          currency: p.currency || "INR",
          interval: p.interval || 1,
          providerPlanId: created.id
        });

        results.push({ code: p.code, providerPlanId: created.id, created: true });
      } catch (err) {
        console.error(`[syncPlansToProvider] Failed to create plan ${p.code}:`, err);
        throw new Error(`Failed to create plan ${p.code} in Razorpay: ${err?.error?.description || err?.message || JSON.stringify(err)}`);
      }
    }

    return results;
  }

  async createSubscription({ userId, planCode, totalCount = 12 }) {
    console.log(`[BillingService.createSubscription] Starting for userId=${userId}, planCode=${planCode}`);
    
    const catalogPlan = this.planCatalog.find(p => p.code === planCode);
    if (!catalogPlan) {
      console.log(`[BillingService] Plan not found in catalog. Available codes:`, this.planCatalog.map(p => p.code));
      throw new Error(`Unknown planCode: ${planCode}`);
    }
    console.log(`[BillingService] Found catalog plan:`, catalogPlan.name);

    // Ensure plan is synced
    let storedPlan = await this.store.getPlanByCode(planCode);
    console.log(`[BillingService] Stored plan from DB:`, storedPlan);
    
    if (!storedPlan?.providerPlanId) {
      console.log(`[BillingService] Plan not synced, syncing now...`);
      await this.syncPlansToProvider();
      storedPlan = await this.store.getPlanByCode(planCode);
      console.log(`[BillingService] After sync, stored plan:`, storedPlan);
    }

    if (!storedPlan?.providerPlanId) {
      throw new Error(`Plan not synced to Razorpay: ${planCode}. Sync failed.`);
    }

    console.log(`[BillingService] Creating Razorpay subscription with planId:`, storedPlan.providerPlanId);
    const providerSub = await this.provider.createSubscription({
      planId: storedPlan.providerPlanId,
      totalCount,
      notes: { userId: String(userId), planCode }
    });
    console.log(`[BillingService] Razorpay subscription created:`, providerSub.id);

    console.log(`[BillingService] Saving subscription to database...`);
    const internalSub = await this.store.createSubscription(
      userId,
      planCode,
      totalCount,
      providerSub.id
    );
    console.log(`[BillingService] Subscription saved:`, internalSub?.id);

    const checkout = this.provider.getCheckoutConfig({
      providerSubscriptionId: providerSub.id,
      name: "Billing POC",
      description: `${planCode} monthly subscription`
    });

    return { subscription: internalSub, providerSubscription: providerSub, checkout };
  }

  // ========== ORDERS API (One-time payments) ==========

  async createOrder({ userId, planCode, customer }) {
    const plan = this.planCatalog.find(p => p.code === planCode);
    if (!plan) {
      throw new Error(`Unknown planCode: ${planCode}`);
    }

    const receipt = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Create order in Razorpay
    const order = await this.provider.createOrder({
      amountPaise: plan.amountPaise,
      currency: plan.currency || "INR",
      receipt,
      notes: {
        userId,
        planCode,
        planName: plan.name,
        customerName: customer.name,
        customerEmail: customer.email
      }
    });

    // Store the pending order/subscription
    const subscription = await this.store.createSubscription(
      userId,
      planCode,
      1, // totalCount for one-time
      null, // No Razorpay subscription ID yet
      {
        razorpayOrderId: order.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerContact: customer.contact,
        status: "pending"
      }
    );

    // Get checkout configuration
    const checkout = this.provider.getOrderCheckoutConfig({
      orderId: order.id,
      amountPaise: plan.amountPaise,
      currency: plan.currency || "INR",
      name: "CloudApp",
      description: `${plan.name} Plan`,
      customer
    });

    return { 
      order, 
      subscription, 
      checkout,
      plan: { code: plan.code, name: plan.name, price: plan.price }
    };
  }

  async verifyPayment({ userId, orderId, paymentId, signature }) {
    // Verify the signature
    const isValid = this.provider.verifyPaymentSignature({
      orderId,
      paymentId,
      signature
    });

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Fetch payment details from Razorpay
    const payment = await this.provider.fetchPayment(paymentId);

    // Find the subscription by order ID
    const subscription = await this.store.getSubscriptionByOrderId(orderId);
    if (!subscription) {
      throw new Error("Subscription not found for this order");
    }

    // Update subscription to active
    await this.store.updateSubscription(subscription.id, {
      status: BILLING_STATUS.ACTIVE,
      razorpayPaymentId: paymentId
    });

    // Create invoice record
    const invoice = await this.store.createInvoice(
      subscription.id,
      userId,
      payment.amount / 100, // Convert paise to rupees
      `Payment for ${subscription.planCode}`
    );

    // Update invoice with payment details
    await this.store.updateInvoice(invoice.id, {
      status: "paid",
      razorpayPaymentId: paymentId,
      razorpayInvoiceId: payment.invoice_id || null,
      paidDate: new Date()
    });

    // Log webhook-like event
    await this.store.logWebhook(
      `payment_${paymentId}`,
      "payment.captured",
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
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        status: payment.status
      },
      subscription: await this.store.getSubscription(subscription.id),
      invoice
    };
  }

  async cancelSubscription({ userId, subscriptionId, cancelAtPeriodEnd = true }) {
    const sub = await this.store.getSubscriptionById(subscriptionId);
    if (!sub) throw new Error("Subscription not found");
    if (String(sub.userId) !== String(userId)) throw new Error("Forbidden");

    const provider = await this.provider.cancelSubscription(sub.providerSubscriptionId, {
      cancelAtCycleEnd: !!cancelAtPeriodEnd
    });

    // If cancelAtPeriodEnd, keep it active but flag it
    await this.store.updateSubscription(subscriptionId, {
      cancelAtPeriodEnd: !!cancelAtPeriodEnd,
      status: cancelAtPeriodEnd ? sub.status : BILLING_STATUS.CANCELLED,
      cancelledAt: cancelAtPeriodEnd ? null : new Date().toISOString()
    });

    return { provider };
  }

  async getMySubscription({ userId }) {
    return this.store.getLatestSubscriptionForUser(userId);
  }

  async handleWebhook({ rawBody, signature }) {
    const ok = this.provider.verifyWebhookSignature(rawBody, signature);
    if (!ok) throw new Error("Invalid webhook signature");

    const event = JSON.parse(rawBody.toString("utf8"));
    const eventName = event?.event || "unknown";

    // Build an idempotency key (Razorpay often provides an id; fallback to event+created_at)
    const eventId = event?.id || event?.event_id || `${eventName}:${event?.created_at || ""}`;

    if (await this.store.hasProcessedEvent(eventId)) {
      return { ignored: true, event: eventName };
    }

    const providerSubscriptionId = extractProviderSubscriptionId(event);
    const newStatus = mapEventToStatus(eventName);

    if (providerSubscriptionId) {
      const internal = await this.store.getSubscriptionByProviderId(providerSubscriptionId);
      if (internal) {
        const patch = {};

        if (newStatus) patch.status = newStatus;
        if (newStatus === BILLING_STATUS.CANCELLED) patch.cancelledAt = new Date().toISOString();

        // Update period from subscription payload if present
        const subEnt = event?.payload?.subscription?.entity;
        if (subEnt?.current_start) patch.currentPeriodStart = safeIsoFromUnix(subEnt.current_start);
        if (subEnt?.current_end) patch.currentPeriodEnd = safeIsoFromUnix(subEnt.current_end);

        await this.store.updateSubscription(internal.id, patch);
      }
    }

    await this.store.markEventProcessed(eventId, eventName, event);
    return { processed: true, event: eventName, providerSubscriptionId, status: newStatus || "NO_CHANGE" };
  }
}
