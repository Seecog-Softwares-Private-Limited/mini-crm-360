# Razorpay Billing Module - Integration Guide

A plug-and-play billing module for SaaS applications with Razorpay payment integration.

---

## 🚀 Quick Integration (3 Steps)

### Step 1: Copy the Module
Copy these folders/files to your project:
```
billing-razorpay-subscription/
├── src/
│   ├── providers/RazorpayProvider.js    # Razorpay API wrapper
│   ├── services/BillingService.js       # Business logic
│   ├── store/MySQLDatabase.js           # Database layer
│   ├── router.js                        # API routes
│   └── constants/billing.constant.js    # Status constants
├── public/index.html                    # (Optional) Demo UI
└── .env                                 # Configuration
```

### Step 2: Install Dependencies
```bash
npm install razorpay mysql2 dotenv express crypto
```

### Step 3: Mount the Router
```javascript
// In your main Express app
import { createBillingRouter } from './billing/router.js';
import { BillingService } from './billing/services/BillingService.js';
import { RazorpayProvider } from './billing/providers/RazorpayProvider.js';
import { MySQLDatabase } from './billing/store/MySQLDatabase.js';

// Initialize
const db = new MySQLDatabase(dbConfig);
const razorpay = new RazorpayProvider(razorpayKeyId, razorpayKeySecret);
const billingService = new BillingService(razorpay, db);

// Mount at any path
app.use('/api/billing', createBillingRouter(billingService, planCatalog));
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/billing/plans` | List all available plans |
| POST | `/billing/orders` | Create payment order (opens checkout) |
| POST | `/billing/orders/:orderId/verify` | Verify payment after checkout |
| GET | `/billing/subscriptions` | Get user's subscriptions |
| GET | `/billing/subscriptions/:id` | Get specific subscription |
| POST | `/billing/webhooks/razorpay` | Razorpay webhook endpoint |

### Create Order Request
```javascript
// POST /billing/orders
// Header: x-user-id: "user_123"
{
  "planCode": "plan_pro",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "9876543210"
  }
}
```

### Response
```javascript
{
  "ok": true,
  "order": { "id": "order_xxx", "amount": 7900 },
  "checkout": {
    "key": "rzp_xxx",
    "order_id": "order_xxx",
    "amount": 7900,
    "prefill": { "name": "John", "email": "..." }
  }
}
```

---

## 🔌 Frontend Integration

### Minimal Checkout Code
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
async function buyPlan(planCode, customerDetails) {
  // 1. Create order
  const res = await fetch('/billing/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ planCode, customer: customerDetails })
  });
  const { checkout, order } = await res.json();
  
  // 2. Open Razorpay
  const rzp = new Razorpay({
    ...checkout,
    handler: async (response) => {
      // 3. Verify payment
      await fetch(`/billing/orders/${order.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify(response)
      });
      alert('Payment successful!');
    }
  });
  rzp.open();
}
</script>
```

---

## 🗄️ Database Schema

```sql
-- Auto-created on startup
CREATE TABLE subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  userId VARCHAR(100),
  planCode VARCHAR(100),
  status VARCHAR(50),           -- pending, active, cancelled
  razorpayOrderId VARCHAR(100),
  razorpayPaymentId VARCHAR(100),
  customerName VARCHAR(200),
  customerEmail VARCHAR(200),
  customerContact VARCHAR(50),
  createdAt DATETIME,
  updatedAt DATETIME,
  UNIQUE KEY unique_user_plan (userId, planCode)
);

CREATE TABLE invoices (...);
CREATE TABLE webhook_logs (...);
CREATE TABLE plans (...);
```

---

## ⚙️ Environment Variables

```env
# Razorpay (get from dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=billing_db

# Server
PORT=3000
```

---

## 🎯 Demo for Team Lead

### Quick Demo Script (5 minutes)

1. **Start the server**
   ```bash
   cd billing-razorpay-subscription
   node src/server.js
   ```

2. **Open browser**: http://localhost:3000

3. **Show the flow**:
   - Click "Get Started" on any plan
   - Fill user details → Opens Razorpay checkout
   - Use test card: `4111 1111 1111 1111` (any expiry, any CVV)
   - Complete payment → Data saved to MySQL

4. **Show database records**:
   ```sql
   SELECT * FROM subscriptions;
   SELECT * FROM invoices;
   SELECT * FROM webhook_logs;
   ```

### Key Points to Highlight
- ✅ Real Razorpay checkout integration
- ✅ Payment verification with signature validation
- ✅ Complete audit trail (invoices + webhook logs)
- ✅ User details captured before payment
- ✅ Duplicate subscription prevention
- ✅ Modular, reusable code structure

---

## 🚨 Production Readiness Checklist

### ✅ Already Implemented
- [x] Razorpay checkout integration
- [x] Payment signature verification
- [x] MySQL persistence
- [x] Invoice generation
- [x] Webhook logging
- [x] Error handling
- [x] Unique constraint on user+plan

### ⚠️ Recommended Before Production

1. **Switch to Live Keys**
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=xxxxx
   ```

2. **Add Authentication Middleware**
   ```javascript
   // Replace x-user-id header with actual auth
   router.use(authMiddleware); // JWT, session, etc.
   ```

3. **Enable HTTPS**
   - Razorpay requires HTTPS in production
   - Use nginx/cloudflare for SSL termination

4. **Configure Webhooks in Razorpay Dashboard**
   - URL: `https://yourdomain.com/billing/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`

5. **Add Rate Limiting**
   ```javascript
   import rateLimit from 'express-rate-limit';
   app.use('/billing', rateLimit({ windowMs: 15*60*1000, max: 100 }));
   ```

6. **Database Improvements**
   - Use connection pooling (already done)
   - Add indexes on frequently queried columns
   - Set up database backups

7. **Logging & Monitoring**
   - Add structured logging (winston/pino)
   - Set up error alerting (Sentry, etc.)

8. **For True Recurring Billing**
   - Current: One-time payments per plan
   - For auto-debit recurring: Need Razorpay Subscriptions feature enabled
   - Contact Razorpay support to enable Subscriptions API

---

## 📁 File Structure

```
billing-razorpay-subscription/
├── src/
│   ├── server.js              # Main entry point
│   ├── router.js              # Express routes
│   ├── providers/
│   │   └── RazorpayProvider.js # Razorpay API calls
│   ├── services/
│   │   └── BillingService.js   # Business logic
│   ├── store/
│   │   └── MySQLDatabase.js    # Database operations
│   └── constants/
│       └── billing.constant.js # Status enums
├── public/
│   └── index.html             # Demo UI
├── scripts/
│   └── setup-mysql.js         # DB setup script
├── .env                       # Configuration
└── package.json
```

---

## 🔄 Adding New Plans

```javascript
// In server.js or your plan config
const planCatalog = [
  {
    id: "plan_basic",
    code: "plan_basic",
    name: "Basic",
    price: 19,
    amountPaise: 1900,  // Price in paise
    currency: "INR",
    features: ["Feature 1", "Feature 2"]
  },
  // Add more plans...
];
```

Then insert into database:
```sql
INSERT INTO plans (id, code, name, amountPaise, currency, planInterval, period, createdAt, updatedAt)
VALUES ('plan_basic', 'plan_basic', 'Basic', 1900, 'INR', 1, 'monthly', NOW(), NOW());
```

---

## 📞 Support

For Razorpay-specific issues:
- Dashboard: https://dashboard.razorpay.com
- Docs: https://razorpay.com/docs/
- Test Cards: https://razorpay.com/docs/payments/payments/test-card-upi-details/
