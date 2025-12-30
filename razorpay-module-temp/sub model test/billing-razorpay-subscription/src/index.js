/**
 * Razorpay Billing Module
 * 
 * A plug-and-play billing solution for SaaS applications.
 * 
 * @example
 * import { initBilling } from './billing';
 * 
 * const billing = await initBilling({
 *   razorpay: { keyId: 'rzp_xxx', keySecret: 'xxx' },
 *   database: { host: 'localhost', user: 'root', password: 'xxx', database: 'billing_db' },
 *   plans: [{ code: 'plan_pro', name: 'Pro', amountPaise: 7900, currency: 'INR' }]
 * });
 * 
 * app.use('/billing', billing.router);
 */

export { createBillingRouter } from "./router.js";
export { BillingService } from "./services/BillingService.js";
export { RazorpayProvider } from "./providers/RazorpayProvider.js";
export { MySQLDatabase } from "./store/MySQLDatabase.js";
export { BILLING_STATUS } from "./constants/billing.constant.js";

/**
 * Initialize the complete billing module with one function call
 * @param {Object} config - Configuration object
 * @returns {Object} { router, service, db, razorpay }
 */
export async function initBilling(config) {
  const { razorpay: rzpConfig, database: dbConfig, plans } = config;
  
  // Initialize database
  const db = new (await import("./store/MySQLDatabase.js")).MySQLDatabase({
    host: dbConfig.host || 'localhost',
    port: dbConfig.port || 3306,
    user: dbConfig.user || 'root',
    password: dbConfig.password,
    database: dbConfig.database || 'billing_db'
  });
  
  // Initialize schema
  await db.initializeSchema();
  
  // Initialize Razorpay
  const razorpay = new (await import("./providers/RazorpayProvider.js")).RazorpayProvider(
    rzpConfig.keyId,
    rzpConfig.keySecret
  );
  
  // Initialize billing service
  const service = new (await import("./services/BillingService.js")).BillingService(razorpay, db);
  
  // Create router
  const { createBillingRouter } = await import("./router.js");
  const router = createBillingRouter(service, plans);
  
  return { router, service, db, razorpay, plans };
}
