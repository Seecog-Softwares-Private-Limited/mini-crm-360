# Razorpay Billing Module

### Professional SaaS Payment Integration Solution

**Version:** 1.0.0  
**Last Updated:** December 2024  
**License:** MIT  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [System Requirements](#3-system-requirements)
4. [Installation](#4-installation)
5. [Configuration](#5-configuration)
6. [Quick Start](#6-quick-start)
7. [API Reference](#7-api-reference)
8. [Frontend Integration](#8-frontend-integration)
9. [Database Schema](#9-database-schema)
10. [Security Considerations](#10-security-considerations)
11. [Production Deployment](#11-production-deployment)
12. [Troubleshooting](#12-troubleshooting)
13. [Changelog](#13-changelog)

---

## 1. Overview

The **Razorpay Billing Module** is a production-ready, plug-and-play payment solution designed for SaaS applications. It provides complete payment processing capabilities using Razorpay's payment gateway, with built-in support for:

- One-time and subscription-based payments
- Secure payment verification
- Invoice generation
- Webhook handling
- MySQL database persistence

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your SaaS Application                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    │
│   │   Frontend  │───▶│  Billing    │───▶│  Razorpay   │    │
│   │   (React,   │    │  Module     │    │  Gateway    │    │
│   │   Vue, etc) │◀───│  (Express)  │◀───│             │    │
│   └─────────────┘    └──────┬──────┘    └─────────────┘    │
│                             │                               │
│                      ┌──────▼──────┐                        │
│                      │   MySQL     │                        │
│                      │   Database  │                        │
│                      └─────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Payment Processing** | Secure checkout via Razorpay gateway |
| **Signature Verification** | Cryptographic verification of all payments |
| **Multi-Plan Support** | Configure unlimited pricing plans |
| **User Subscriptions** | Track user plan subscriptions |
| **Invoice Generation** | Automatic invoice creation post-payment |
| **Webhook Logging** | Complete audit trail of payment events |
| **Duplicate Prevention** | Unique constraint prevents double subscriptions |

### Technical Features

| Feature | Description |
|---------|-------------|
| **ES Modules** | Modern JavaScript with ES6+ imports |
| **Connection Pooling** | Efficient MySQL connection management |
| **Error Handling** | Comprehensive error responses |
| **Modular Design** | Loosely coupled, testable components |
| **Zero Dependencies** | Only essential packages required |

---

## 3. System Requirements

### Runtime Requirements

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | 18.x or higher |
| MySQL | 5.7 or higher |
| npm | 8.x or higher |

### Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "razorpay": "^2.9.0",
    "mysql2": "^3.6.0",
    "dotenv": "^16.0.0"
  }
}
```

### Razorpay Account

- Active Razorpay account (Test or Live mode)
- API Key ID and Key Secret from Dashboard
- Webhook endpoint configured (for production)

---

## 4. Installation

### Method 1: Direct Copy (Recommended)

Copy the module into your project:

```bash
# Clone or download the module
git clone <repository-url> billing-module

# Copy to your project
cp -r billing-module/src your-project/billing
```

**Resulting structure:**
```
your-saas-project/
├── src/
│   └── your-existing-code/
├── billing/                    # Copied module
│   ├── index.js               # Main exports
│   ├── router.js              # Express routes
│   ├── providers/
│   │   └── RazorpayProvider.js
│   ├── services/
│   │   └── BillingService.js
│   ├── store/
│   │   └── MySQLDatabase.js
│   └── constants/
│       └── billing.constant.js
├── package.json
└── .env
```

### Method 2: npm Link (Development)

```bash
# In billing module directory
cd billing-razorpay-subscription
npm link

# In your project
cd your-saas-project
npm link billing-razorpay-subscription
```

### Method 3: Git Submodule

```bash
cd your-saas-project
git submodule add <repository-url> billing
git submodule update --init
```

### Install Dependencies

```bash
npm install express razorpay mysql2 dotenv
```

---

## 5. Configuration

### Environment Variables

Create a `.env` file in your project root:

```env
# ─────────────────────────────────────────────
# RAZORPAY CONFIGURATION
# ─────────────────────────────────────────────
# Get these from: https://dashboard.razorpay.com/app/keys

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# ─────────────────────────────────────────────
# DATABASE CONFIGURATION
# ─────────────────────────────────────────────

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=your_database_name

# ─────────────────────────────────────────────
# APPLICATION CONFIGURATION
# ─────────────────────────────────────────────

PORT=3000
NODE_ENV=development
```

### Configuration Object

When initializing the module programmatically:

```javascript
const config = {
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  plans: [
    // Your pricing plans (see Section 6)
  ]
};
```

---

## 6. Quick Start

### Step 1: Define Your Plans

```javascript
const plans = [
  {
    id: 'starter',
    code: 'starter',
    name: 'Starter',
    description: 'Perfect for individuals',
    price: 299,              // Display price
    amountPaise: 29900,      // Amount in paise (₹299.00)
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    features: [
      '5 Projects',
      '1 GB Storage',
      'Email Support'
    ]
  },
  {
    id: 'professional',
    code: 'professional',
    name: 'Professional',
    description: 'For growing teams',
    price: 799,
    amountPaise: 79900,
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    features: [
      'Unlimited Projects',
      '50 GB Storage',
      'Priority Support',
      'API Access'
    ]
  },
  {
    id: 'enterprise',
    code: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions',
    price: 2499,
    amountPaise: 249900,
    currency: 'INR',
    interval: 1,
    period: 'monthly',
    features: [
      'Everything in Professional',
      'Unlimited Storage',
      '24/7 Phone Support',
      'Custom Integrations',
      'Dedicated Account Manager'
    ]
  }
];
```

### Step 2: Initialize the Module

```javascript
import express from 'express';
import dotenv from 'dotenv';
import { initBilling } from './billing/index.js';

dotenv.config();

const app = express();
app.use(express.json());

// Initialize billing module
const billing = await initBilling({
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  plans: plans  // Your plans array from Step 1
});

// Mount billing routes
app.use('/api/billing', billing.router);

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Step 3: Verify Installation

```bash
# Start your server
node app.js

# Test the plans endpoint
curl http://localhost:3000/api/billing/plans
```

Expected response:
```json
{
  "ok": true,
  "plans": [
    { "id": "starter", "name": "Starter", "price": 299 },
    { "id": "professional", "name": "Professional", "price": 799 },
    { "id": "enterprise", "name": "Enterprise", "price": 2499 }
  ]
}
```

---

## 7. API Reference

### Base URL

```
https://your-domain.com/api/billing
```

### Authentication

All endpoints require a user identifier passed via header:

```
x-user-id: user_12345
```

> **Note:** Replace this with your actual authentication middleware in production.

---

### GET /plans

Retrieve all available pricing plans.

**Request:**
```http
GET /api/billing/plans
```

**Response:**
```json
{
  "ok": true,
  "plans": [
    {
      "id": "starter",
      "code": "starter",
      "name": "Starter",
      "description": "Perfect for individuals",
      "price": 299,
      "amountPaise": 29900,
      "currency": "INR",
      "features": ["5 Projects", "1 GB Storage", "Email Support"]
    }
  ]
}
```

---

### POST /orders

Create a new payment order and get checkout configuration.

**Request:**
```http
POST /api/billing/orders
Content-Type: application/json
x-user-id: user_12345

{
  "planCode": "professional",
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "9876543210"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "order": {
    "id": "order_ABCxyz123",
    "amount": 79900,
    "currency": "INR",
    "status": "created"
  },
  "checkout": {
    "key": "rzp_test_xxxxx",
    "order_id": "order_ABCxyz123",
    "amount": 79900,
    "currency": "INR",
    "name": "Your Company",
    "description": "Professional Plan",
    "prefill": {
      "name": "John Doe",
      "email": "john@example.com",
      "contact": "9876543210"
    }
  },
  "plan": {
    "code": "professional",
    "name": "Professional",
    "price": 799
  }
}
```

---

### POST /orders/:orderId/verify

Verify a completed payment and activate subscription.

**Request:**
```http
POST /api/billing/orders/order_ABCxyz123/verify
Content-Type: application/json
x-user-id: user_12345

{
  "razorpay_order_id": "order_ABCxyz123",
  "razorpay_payment_id": "pay_XYZ789",
  "razorpay_signature": "signature_hash_here"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "Payment verified successfully",
  "subscription": {
    "id": "sub_1234567890",
    "userId": "user_12345",
    "planCode": "professional",
    "status": "active",
    "razorpayPaymentId": "pay_XYZ789"
  },
  "invoice": {
    "id": "inv_1234567890",
    "amount": 79900,
    "status": "paid"
  }
}
```

---

### GET /subscriptions

Get all subscriptions for the authenticated user.

**Request:**
```http
GET /api/billing/subscriptions
x-user-id: user_12345
```

**Response:**
```json
{
  "ok": true,
  "subscriptions": [
    {
      "id": "sub_1234567890",
      "userId": "user_12345",
      "planCode": "professional",
      "status": "active",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "createdAt": "2024-12-30T10:00:00.000Z"
    }
  ]
}
```

---

### GET /subscriptions/:id

Get a specific subscription by ID.

**Request:**
```http
GET /api/billing/subscriptions/sub_1234567890
x-user-id: user_12345
```

---

### POST /webhooks/razorpay

Endpoint for Razorpay webhook events.

**Request:**
```http
POST /api/billing/webhooks/razorpay
Content-Type: application/json
X-Razorpay-Signature: webhook_signature

{
  "event": "payment.captured",
  "payload": { ... }
}
```

---

### Error Responses

All endpoints return consistent error format:

```json
{
  "ok": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing user ID |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate subscription |
| 500 | Internal Server Error |

---

## 8. Frontend Integration

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>Upgrade Plan</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <button onclick="subscribe('professional')">
    Upgrade to Professional - ₹799/month
  </button>

  <script>
    // Get current user ID from your auth system
    const currentUserId = 'user_12345';
    
    async function subscribe(planCode) {
      try {
        // Step 1: Get customer details (from your UI/state)
        const customer = {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9876543210'
        };
        
        // Step 2: Create order
        const orderResponse = await fetch('/api/billing/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUserId
          },
          body: JSON.stringify({ planCode, customer })
        });
        
        const { order, checkout, plan } = await orderResponse.json();
        
        // Step 3: Open Razorpay checkout
        const razorpay = new Razorpay({
          ...checkout,
          handler: async function(response) {
            // Step 4: Verify payment
            const verifyResponse = await fetch(
              `/api/billing/orders/${order.id}/verify`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-user-id': currentUserId
                },
                body: JSON.stringify(response)
              }
            );
            
            const result = await verifyResponse.json();
            
            if (result.ok) {
              alert('Payment successful! Welcome to ' + plan.name);
              window.location.reload();
            } else {
              alert('Payment verification failed');
            }
          },
          modal: {
            ondismiss: function() {
              console.log('Checkout closed');
            }
          }
        });
        
        razorpay.open();
        
      } catch (error) {
        console.error('Payment error:', error);
        alert('Something went wrong. Please try again.');
      }
    }
  </script>
</body>
</html>
```

### React Component

```jsx
import React, { useState } from 'react';

const PricingCard = ({ plan, userId }) => {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      // Create order
      const response = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({
          planCode: plan.code,
          customer: {
            name: 'User Name',  // Get from your user context
            email: 'user@example.com',
            contact: '9876543210'
          }
        })
      });
      
      const { order, checkout } = await response.json();
      
      // Load and open Razorpay
      const razorpay = new window.Razorpay({
        ...checkout,
        handler: async (paymentResponse) => {
          await fetch(`/api/billing/orders/${order.id}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userId
            },
            body: JSON.stringify(paymentResponse)
          });
          
          // Refresh user subscription status
          window.location.href = '/dashboard';
        }
      });
      
      razorpay.open();
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-card">
      <h3>{plan.name}</h3>
      <p className="price">₹{plan.price}/month</p>
      <ul>
        {plan.features.map((feature, i) => (
          <li key={i}>{feature}</li>
        ))}
      </ul>
      <button onClick={handleSubscribe} disabled={loading}>
        {loading ? 'Processing...' : 'Subscribe'}
      </button>
    </div>
  );
};

export default PricingCard;
```

### Vue Component

```vue
<template>
  <div class="pricing-card">
    <h3>{{ plan.name }}</h3>
    <p class="price">₹{{ plan.price }}/month</p>
    <ul>
      <li v-for="feature in plan.features" :key="feature">
        {{ feature }}
      </li>
    </ul>
    <button @click="subscribe" :disabled="loading">
      {{ loading ? 'Processing...' : 'Subscribe' }}
    </button>
  </div>
</template>

<script>
export default {
  props: ['plan', 'userId', 'customer'],
  data() {
    return { loading: false };
  },
  methods: {
    async subscribe() {
      this.loading = true;
      
      const res = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId
        },
        body: JSON.stringify({
          planCode: this.plan.code,
          customer: this.customer
        })
      });
      
      const { order, checkout } = await res.json();
      
      const razorpay = new Razorpay({
        ...checkout,
        handler: async (response) => {
          await this.verifyPayment(order.id, response);
        }
      });
      
      razorpay.open();
      this.loading = false;
    },
    
    async verifyPayment(orderId, response) {
      await fetch(`/api/billing/orders/${orderId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': this.userId
        },
        body: JSON.stringify(response)
      });
      
      this.$router.push('/dashboard');
    }
  }
};
</script>
```

---

## 9. Database Schema

### Tables Created Automatically

The module automatically creates the following tables on initialization:

#### subscriptions

```sql
CREATE TABLE subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  userId VARCHAR(100) NOT NULL,
  planCode VARCHAR(100) NOT NULL,
  razorpaySubscriptionId VARCHAR(100),
  razorpayOrderId VARCHAR(100),
  razorpayPaymentId VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  customerName VARCHAR(200),
  customerEmail VARCHAR(200),
  customerContact VARCHAR(50),
  totalCount INT DEFAULT 0,
  billedCount INT DEFAULT 0,
  currentCycleStart DATETIME,
  currentCycleEnd DATETIME,
  nextBillingDate DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  cancelledAt DATETIME,
  UNIQUE KEY unique_user_plan (userId, planCode)
);
```

#### invoices

```sql
CREATE TABLE invoices (
  id VARCHAR(100) PRIMARY KEY,
  subscriptionId VARCHAR(100),
  razorpayInvoiceId VARCHAR(100),
  razorpayPaymentId VARCHAR(100),
  amount INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'pending',
  billingPeriodStart DATETIME,
  billingPeriodEnd DATETIME,
  paidAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
);
```

#### webhook_logs

```sql
CREATE TABLE webhook_logs (
  id VARCHAR(100) PRIMARY KEY,
  eventType VARCHAR(100),
  razorpayEventId VARCHAR(100),
  payload JSON,
  processedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### plans

```sql
CREATE TABLE plans (
  id VARCHAR(100) PRIMARY KEY,
  code VARCHAR(100) UNIQUE,
  name VARCHAR(200),
  amountPaise INT,
  currency VARCHAR(3) DEFAULT 'INR',
  planInterval INT DEFAULT 1,
  period VARCHAR(20) DEFAULT 'monthly',
  providerPlanId VARCHAR(100),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Subscription Status Values

| Status | Description |
|--------|-------------|
| `pending` | Order created, awaiting payment |
| `active` | Payment completed, subscription active |
| `cancelled` | User cancelled the subscription |
| `expired` | Subscription period ended |

---

## 10. Security Considerations

### Payment Signature Verification

All payments are verified using HMAC SHA256:

```javascript
// This is done automatically by the module
const expectedSignature = crypto
  .createHmac('sha256', keySecret)
  .update(orderId + '|' + paymentId)
  .digest('hex');

if (expectedSignature !== providedSignature) {
  throw new Error('Invalid signature');
}
```

### Best Practices

| Practice | Implementation |
|----------|----------------|
| **Never expose Key Secret** | Keep in environment variables only |
| **Use HTTPS** | Required for production |
| **Validate User ID** | Replace x-user-id with proper auth |
| **Rate Limiting** | Add express-rate-limit middleware |
| **Input Validation** | Validate all request bodies |
| **SQL Injection Prevention** | Uses parameterized queries |

### Adding Authentication Middleware

```javascript
// Replace the simple x-user-id header with your auth
import { verifyToken } from './auth/jwt.js';

app.use('/api/billing', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const user = await verifyToken(token);
    req.userId = user.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.use('/api/billing', billing.router);
```

---

## 11. Production Deployment

### Pre-Deployment Checklist

- [ ] Switch to Razorpay Live keys
- [ ] Configure production MySQL database
- [ ] Enable HTTPS (required by Razorpay)
- [ ] Set up webhook endpoint in Razorpay Dashboard
- [ ] Add proper authentication middleware
- [ ] Configure rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Enable database backups
- [ ] Test complete payment flow

### Environment Variables (Production)

```env
NODE_ENV=production

# Live Razorpay keys
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Production database
DB_HOST=your-db-host.rds.amazonaws.com
DB_PORT=3306
DB_USER=billing_user
DB_PASSWORD=very_secure_password_here
DB_NAME=production_db

# Application
PORT=3000
```

### Configuring Razorpay Webhooks

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → Webhooks
2. Add new webhook:
   - **URL:** `https://your-domain.com/api/billing/webhooks/razorpay`
   - **Events:** `payment.captured`, `payment.failed`, `order.paid`
3. Copy the webhook secret and add to `.env`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
      - RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
      - DB_HOST=mysql
      - DB_USER=root
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=billing_db
    depends_on:
      - mysql
      
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_PASSWORD}
      - MYSQL_DATABASE=billing_db
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

---

## 12. Troubleshooting

### Common Issues

#### "Duplicate entry" error

**Cause:** User already has a subscription for this plan.

**Solution:** 
```sql
-- Delete pending subscriptions
DELETE FROM subscriptions WHERE userId = 'user_id' AND status = 'pending';
```

Or modify the code to reuse existing pending subscriptions.

---

#### "Invalid signature" error

**Cause:** Payment verification failed.

**Possible causes:**
1. Wrong Razorpay Key Secret
2. Order ID mismatch
3. Request tampering

**Solution:** Verify your `RAZORPAY_KEY_SECRET` matches the dashboard.

---

#### "Unknown column" error

**Cause:** Database schema is outdated.

**Solution:**
```sql
-- Add missing columns
ALTER TABLE subscriptions ADD COLUMN razorpayOrderId VARCHAR(100);
ALTER TABLE subscriptions ADD COLUMN razorpayPaymentId VARCHAR(100);
ALTER TABLE subscriptions ADD COLUMN customerName VARCHAR(200);
ALTER TABLE subscriptions ADD COLUMN customerEmail VARCHAR(200);
ALTER TABLE subscriptions ADD COLUMN customerContact VARCHAR(50);
```

---

#### Checkout not opening

**Cause:** Razorpay script not loaded.

**Solution:** Ensure the script is loaded before calling:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

#### CORS errors

**Solution:** Add CORS middleware:
```javascript
import cors from 'cors';
app.use(cors({ origin: 'https://your-frontend.com' }));
```

---

### Debug Mode

Enable verbose logging:

```javascript
const billing = await initBilling({
  ...config,
  debug: true  // Logs all API calls
});
```

---

## 13. Changelog

### Version 1.0.0 (December 2024)

- Initial release
- Razorpay Orders API integration
- MySQL database support
- Express router with REST endpoints
- Payment signature verification
- Invoice and webhook logging
- Frontend integration examples

---

## Support

For issues and feature requests, please open an issue on the repository.

**Razorpay Resources:**
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Test Card Numbers](https://razorpay.com/docs/payments/payments/test-card-upi-details/)
- [Razorpay Dashboard](https://dashboard.razorpay.com)

---

*This documentation is part of the Razorpay Billing Module. MIT Licensed.*
