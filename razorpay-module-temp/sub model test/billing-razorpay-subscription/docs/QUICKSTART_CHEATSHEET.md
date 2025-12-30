# Quick Start Cheatsheet

## 1️⃣ Install

```bash
npm install express razorpay mysql2 dotenv
```

## 2️⃣ Copy Module

Copy `src/` folder to your project as `billing/`

## 3️⃣ Configure (.env)

```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=xxxxx
DB_NAME=your_db
```

## 4️⃣ Initialize (10 lines)

```javascript
import express from 'express';
import { initBilling } from './billing/index.js';

const app = express();
app.use(express.json());

const billing = await initBilling({
  razorpay: { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET },
  database: { host: 'localhost', user: 'root', password: process.env.DB_PASSWORD, database: 'your_db' },
  plans: [
    { code: 'pro', name: 'Pro', price: 499, amountPaise: 49900, currency: 'INR', features: [] }
  ]
});

app.use('/api/billing', billing.router);
app.listen(3000);
```

## 5️⃣ Frontend (15 lines)

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
async function buy(planCode) {
  const res = await fetch('/api/billing/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
    body: JSON.stringify({ planCode, customer: { name, email, contact } })
  });
  const { order, checkout } = await res.json();
  
  new Razorpay({
    ...checkout,
    handler: (r) => fetch(`/api/billing/orders/${order.id}/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(r)
    }).then(() => location.reload())
  }).open();
}
</script>
```

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/billing/plans` | List plans |
| POST | `/api/billing/orders` | Create order |
| POST | `/api/billing/orders/:id/verify` | Verify payment |
| GET | `/api/billing/subscriptions` | User subscriptions |

## 🧪 Test Card

```
Number: 4111 1111 1111 1111
Expiry: Any future date
CVV:    Any 3 digits
```

## 📁 Files You Need

```
billing/
├── index.js           # Main export + initBilling()
├── router.js          # Express routes
├── providers/RazorpayProvider.js
├── services/BillingService.js
├── store/MySQLDatabase.js
└── constants/billing.constant.js
```

---

Full docs: `docs/BILLING_MODULE_DOCUMENTATION.md`
