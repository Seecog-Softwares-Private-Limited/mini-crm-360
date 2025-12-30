# 🚀 SaaS Subscription Billing System

A production-ready subscription billing system built with Express.js, MySQL, and Razorpay integration.

## ✨ Features

- **💳 Razorpay Integration** - Complete recurring payment support
- **📊 MySQL Database** - Persistent storage with automatic schema
- **📱 Professional UI** - Beautiful pricing page with checkout modal
- **🔄 Subscription Management** - Create, cancel, and track subscriptions
- **📈 Invoice System** - Automatic monthly invoicing and payment tracking
- **🧪 Testing Tools** - Admin endpoints for recurring payment simulation
- **⚡ Auto-scaling** - Connection pooling for high-load scenarios

## 📋 Quick Start

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- Razorpay account (test mode)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up MySQL
Create a MySQL database and configure `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=billing_db
```

Then run the setup script:
```bash
npm run setup-db
```

### 3. Configure Razorpay
Add your test credentials to `.env`:
```env
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Start the Server
```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

Visit `http://localhost:3000` 🎉

## 📊 Database Schema

```sql
subscriptions
├── id (primary key)
├── userId
├── planCode
├── razorpaySubscriptionId
├── status (active/scheduled_for_cancellation/cancelled)
├── totalCount, billedCount
├── currentCycleStart, currentCycleEnd
└── timestamps

invoices
├── id (primary key)
├── subscriptionId (foreign key)
├── userId
├── amount, currency
├── status (issued/paid/failed)
├── razorpayPaymentId, razorpayInvoiceId
└── timestamps

webhook_logs
├── id (primary key)
├── eventId (unique)
├── eventType
├── data (JSON)
├── processed
└── createdAt
```

## 🔌 API Endpoints

### Billing Routes (`/billing`)
- `POST /billing/create-subscription` - Create a new subscription
- `POST /billing/cancel-subscription` - Cancel active subscription
- `POST /billing/webhook` - Razorpay webhook endpoint

### Admin Routes (Development Testing)
- `GET /admin/health` - Server status and features
- `POST /admin/simulate-invoice` - Create test invoice
- `POST /admin/simulate-payment/:invoiceId` - Mark invoice as paid
- `GET /admin/subscription-details` - View all subscription data

## 🧪 Testing Recurring Payments

1. Open `http://localhost:3000`
2. Select a plan and subscribe
3. Use test card: **4111 1111 1111 1111** (any future date/CVC)
4. Test recurring billing:

```bash
# Create monthly invoice
curl -X POST http://localhost:3000/admin/simulate-invoice \
  -H "x-user-id: test-user"

# Mark as paid
curl -X POST http://localhost:3000/admin/simulate-payment/:invoiceId \
  -H "x-user-id: test-user"

# View details
curl http://localhost:3000/admin/subscription-details \
  -H "x-user-id: test-user"
```

## 📁 Project Structure

```
billing-razorpay-subscription/
├── src/
│   ├── server.js              # Express + MySQL setup
│   ├── index.js               # Service exports
│   ├── router.js              # Billing routes
│   ├── constants/
│   ├── providers/             # Razorpay provider
│   ├── services/              # Business logic
│   └── store/
│       └── MySQLDatabase.js   # Database layer
├── public/
│   └── index.html             # Pricing UI
├── scripts/
│   └── setup-mysql.js         # DB initialization
├── .env                       # Configuration
└── package.json
```

## 🔐 Security Checklist

- [ ] Change default MySQL credentials
- [ ] Set environment-specific API keys
- [ ] Enable HTTPS/TLS in production
- [ ] Configure CORS appropriately
- [ ] Add rate limiting
- [ ] Implement request validation
- [ ] Set up webhook signature verification
- [ ] Enable database encryption at rest
- [ ] Use connection pooling for DB
- [ ] Monitor and log all transactions

## 🚀 Deployment

### Deploy to Production
1. Update `.env` with production credentials
2. Use a process manager (PM2, systemd, etc.)
3. Set up MySQL backups
4. Configure reverse proxy (Nginx)
5. Enable monitoring and alerting

### Example PM2 Configuration
```javascript
module.exports = {
  apps: [{
    name: 'billing-server',
    script: './src/server.js',
    instances: 4,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## 📈 Performance Features

- **Connection Pooling** - mysql2/promise manages multiple connections
- **Prepared Statements** - Prevent SQL injection
- **Indexed Queries** - Fast lookups on userId, status, dates
- **Error Recovery** - Automatic retry on transient failures
- **Memory Efficient** - Streams for large data sets

## 🐛 Troubleshooting

### MySQL Connection Error
```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in .env
cat .env | grep DB_
```

### Razorpay Checkout Not Loading
- Verify keys in `.env`
- Check browser console for JS errors
- Confirm `public/index.html` is served

### Subscriptions Not Creating
- Ensure MySQL is initialized: `npm run setup-db`
- Check `/admin/subscription-details` endpoint
- Review server logs for errors

## 📚 API Methods

### MySQLDatabaseService
```javascript
// Subscriptions
await store.createSubscription(userId, planCode, totalCount, razorpayId)
await store.getSubscriptionByUserId(userId)
await store.updateSubscription(subscriptionId, updates)
await store.cancelSubscription(subscriptionId, cancelAtPeriodEnd)

// Invoices
await store.createInvoice(subscriptionId, userId, amount, description)
await store.getInvoicesBySubscription(subscriptionId)
await store.markInvoiceAsPaid(invoiceId, razorpayPaymentId)

// Analytics
await store.getSubscriptionStats(userId)
await store.getRevenueStats(startDate, endDate)

// Webhooks
await store.logWebhook(eventId, eventType, data)
await store.markWebhookProcessed(eventId)
```

## 🤝 Contributing

To contribute to this project:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License - feel free to use this in your projects

## 🆘 Support

For Razorpay integration issues: https://razorpay.com/docs/  
For MySQL help: https://dev.mysql.com/doc/  
For Express.js: https://expressjs.com/

---

Built with ❤️ for subscription businesses
