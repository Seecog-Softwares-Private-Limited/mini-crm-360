import express from "express";
import dotenv from "dotenv";
import { createBillingRouter } from "./index.js";
import { MySQLDatabaseService } from "./store/MySQLDatabase.js";

// Load environment from local .env
dotenv.config();

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const PORT = process.env.PORT || 3000;

const razorpay = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
};

const store = new MySQLDatabaseService();

const getUserId = (req) => {
  return req.headers["x-user-id"] || req.query.userId || "test-user";
};

// Sample SaaS plans with recurring payment info
const planCatalog = [
  {
    id: "plan_starter",
    code: "plan_starter",
    name: "Starter",
    description: "Perfect for individuals and small projects",
    price: 29,
    amountPaise: 2900,
    currency: "INR",
    interval: 1,
    period: "monthly",
    features: [
      "Up to 5 projects",
      "1 GB storage",
      "Community support",
      "Basic analytics"
    ]
  },
  {
    id: "plan_pro",
    code: "plan_pro",
    name: "Pro",
    description: "Ideal for growing teams and businesses",
    price: 79,
    amountPaise: 7900,
    currency: "INR",
    interval: 1,
    period: "monthly",
    features: [
      "Unlimited projects",
      "50 GB storage",
      "Priority email support",
      "Advanced analytics",
      "Team collaboration"
    ]
  },
  {
    id: "plan_enterprise",
    code: "plan_enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: 299,
    amountPaise: 29900,
    currency: "INR",
    interval: 1,
    period: "monthly",
    features: [
      "Everything in Pro",
      "1 TB storage",
      "24/7 phone & email support",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee"
    ]
  }
];


(async () => {
  try {
    // Initialize database
    await store.initialize();

    // Serve static files from public/ folder
    app.use(express.static("public"));
    app.use(express.json());

    const router = createBillingRouter({ razorpay, store, getUserId, planCatalog });
    app.use(router);

    // Admin endpoints for testing recurring payments
    app.post("/admin/simulate-invoice", async (req, res) => {
      try {
        const userId = getUserId(req);
        const subscription = await store.getSubscriptionByUserId(userId);

        if (!subscription) {
          return res.status(404).json({ ok: false, message: "No active subscription found" });
        }

        // Create a test invoice for the subscription
        const planPrice = 
          subscription.planCode === "plan_starter" ? 29 :
          subscription.planCode === "plan_pro" ? 79 : 299;

        const invoice = await store.createInvoice(
          subscription.id,
          userId,
          planPrice,
          `Monthly billing for ${subscription.planCode}`
        );

        res.json({ ok: true, invoice });
      } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
      }
    });

    // Simulate invoice payment
    app.post("/admin/simulate-payment/:invoiceId", async (req, res) => {
      try {
        const { invoiceId } = req.params;
        const paymentId = `pay_test_${Date.now()}`;
        const invoice = await store.markInvoiceAsPaid(invoiceId, paymentId);
        res.json({ ok: true, invoice });
      } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
      }
    });

    // Get subscription details with invoices
    app.get("/admin/subscription-details", async (req, res) => {
      try {
        const userId = getUserId(req);
        const subscription = await store.getSubscriptionByUserId(userId);

        if (!subscription) {
          return res.status(404).json({ ok: false, message: "No active subscription" });
        }

        const invoices = await store.getInvoicesBySubscription(subscription.id);
        const stats = await store.getSubscriptionStats(userId);

        res.json({ ok: true, subscription, invoices, stats });
      } catch (e) {
        res.status(500).json({ ok: false, message: e.message });
      }
    });

    // Production readiness health check
    app.get("/admin/health", (req, res) => {
      res.json({
        ok: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: "MySQL (persistent)",
        webhookSecret: !!razorpay.webhookSecret,
        features: {
          subscriptions: true,
          recurringBilling: true,
          webhooks: true,
          invoiceTracking: true,
          persistentStorage: true
        }
      });
    });

    app.listen(PORT, () => {
      console.log(`✅ Billing server listening on http://localhost:${PORT}`);
      console.log(`📊 Admin endpoints: /admin/health, /admin/simulate-invoice, /admin/simulate-payment/:invoiceId, /admin/subscription-details`);
    });
  } catch (e) {
    console.error("❌ Failed to start billing server:", e.message || e);
    process.exit(1);
  }
})();
