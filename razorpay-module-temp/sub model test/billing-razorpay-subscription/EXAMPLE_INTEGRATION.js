/**
 * Example: How to integrate the billing module into your SaaS
 * 
 * This shows the minimal code needed to add Razorpay billing
 * to any existing Express application.
 */

import express from 'express';
import { initBilling } from './src/index.js';

const app = express();
app.use(express.json());

// Your existing routes
app.get('/', (req, res) => res.send('My SaaS App'));

// ============================================
// ADD BILLING IN JUST 20 LINES
// ============================================

const billing = await initBilling({
  // Razorpay credentials (from dashboard.razorpay.com)
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_xxxxx',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'xxxxx'
  },
  
  // MySQL database config
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',
    database: 'your_saas_db'  // Can be your existing DB
  },
  
  // Define your pricing plans
  plans: [
    {
      id: 'free',
      code: 'free',
      name: 'Free',
      price: 0,
      amountPaise: 0,
      currency: 'INR',
      features: ['5 projects', 'Basic support']
    },
    {
      id: 'pro',
      code: 'pro',
      name: 'Pro',
      price: 499,
      amountPaise: 49900,
      currency: 'INR',
      features: ['Unlimited projects', 'Priority support', 'API access']
    },
    {
      id: 'enterprise',
      code: 'enterprise',
      name: 'Enterprise',
      price: 1999,
      amountPaise: 199900,
      currency: 'INR',
      features: ['Everything in Pro', 'Custom integrations', 'SLA']
    }
  ]
});

// Mount billing routes at any path you want
app.use('/api/billing', billing.router);

// ============================================
// THAT'S IT! Now you have these endpoints:
// ============================================
// GET  /api/billing/plans              - List plans
// POST /api/billing/orders             - Create payment order
// POST /api/billing/orders/:id/verify  - Verify payment
// GET  /api/billing/subscriptions      - User's subscriptions
// POST /api/billing/webhooks/razorpay  - Razorpay webhooks

// ============================================
// USE IN YOUR APP LOGIC
// ============================================

// Check if user has active subscription
app.get('/api/premium-feature', async (req, res) => {
  const userId = req.headers['x-user-id'];
  
  // Get user's subscriptions from billing service
  const subscriptions = await billing.service.getUserSubscriptions(userId);
  const hasProPlan = subscriptions.some(s => 
    s.planCode === 'pro' && s.status === 'active'
  );
  
  if (!hasProPlan) {
    return res.status(403).json({ error: 'Pro plan required' });
  }
  
  res.json({ data: 'Premium content here!' });
});

// ============================================
// FRONTEND: Trigger checkout
// ============================================
/*
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
async function subscribe(planCode) {
  // 1. Create order
  const res = await fetch('/api/billing/orders', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': currentUserId  // Your auth user ID
    },
    body: JSON.stringify({
      planCode: planCode,
      customer: { name: userName, email: userEmail, contact: userPhone }
    })
  });
  const { order, checkout } = await res.json();
  
  // 2. Open Razorpay checkout
  new Razorpay({
    ...checkout,
    handler: async (response) => {
      // 3. Verify payment
      await fetch(`/api/billing/orders/${order.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUserId },
        body: JSON.stringify(response)
      });
      alert('Payment successful!');
      location.reload();
    }
  }).open();
}
</script>

<button onclick="subscribe('pro')">Upgrade to Pro - ₹499/month</button>
*/

app.listen(3000, () => {
  console.log('Your SaaS with billing: http://localhost:3000');
  console.log('Billing API: http://localhost:3000/api/billing/plans');
});
