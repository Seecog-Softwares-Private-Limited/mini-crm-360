// src/billing/index.js
/**
 * Razorpay Billing Module for Mini CRM 360
 * 
 * A plug-and-play billing solution integrated with the existing plans system.
 * 
 * @example
 * import { initBilling } from './billing';
 * 
 * const billing = await initBilling({
 *   razorpay: { 
 *     keyId: process.env.RAZORPAY_KEY_ID, 
 *     keySecret: process.env.RAZORPAY_KEY_SECRET,
 *     webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
 *   }
 * });
 * 
 * app.use(billing.router);
 */

export { createBillingRouter } from "./router.js";
export { BillingService } from "./services/BillingService.js";
export { RazorpayProvider } from "./providers/RazorpayProvider.js";
export { SequelizeStore, PaymentLog, Invoice, WebhookLog, Subscription } from "./store/SequelizeStore.js";
export { BILLING_STATUS, PAYMENT_STATUS } from "./constants/billing.constant.js";

/**
 * Initialize the complete billing module
 * @param {Object} config - Configuration object
 * @returns {Object} { router, service, store, provider }
 */
export async function initBilling(config = {}) {
  const { 
    razorpay: rzpConfig = {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
    }
  } = config;
  
  // Initialize store
  const { SequelizeStore } = await import("./store/SequelizeStore.js");
  const store = new SequelizeStore();
  await store.initialize();
  
  // Initialize Razorpay provider
  const { RazorpayProvider } = await import("./providers/RazorpayProvider.js");
  const provider = new RazorpayProvider({
    keyId: rzpConfig.keyId,
    keySecret: rzpConfig.keySecret,
    webhookSecret: rzpConfig.webhookSecret
  });
  
  // Initialize billing service
  const { BillingService } = await import("./services/BillingService.js");
  const service = new BillingService({ provider, store });
  
  // Create router
  const { createBillingRouter } = await import("./router.js");
  const router = createBillingRouter({ billingService: service });
  
  console.log('✅ Billing module initialized');
  if (!provider.isConfigured()) {
    console.warn('⚠️ Razorpay not configured - payment features will be limited');
  }
  
  return { router, service, store, provider };
}
