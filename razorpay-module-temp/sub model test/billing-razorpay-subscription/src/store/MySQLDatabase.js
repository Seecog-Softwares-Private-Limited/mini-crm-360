import mysql from 'mysql2/promise';

export class MySQLDatabaseService {
  constructor(config) {
    this.config = config || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'billing_db'
    };
    this.pool = null;
  }

  async initialize() {
    this.pool = await mysql.createPool(this.config);
    await this.initializeSchema();
    console.log('✅ MySQL connected successfully');
  }

  async initializeSchema() {
    const connection = await this.pool.getConnection();

    try {
      // Create subscriptions table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id VARCHAR(100) PRIMARY KEY,
          userId VARCHAR(100) NOT NULL,
          planCode VARCHAR(100) NOT NULL,
          razorpaySubscriptionId VARCHAR(100),
          razorpayOrderId VARCHAR(100),
          razorpayPaymentId VARCHAR(100),
          customerName VARCHAR(200),
          customerEmail VARCHAR(200),
          customerContact VARCHAR(50),
          status VARCHAR(50) DEFAULT 'pending',
          totalCount INT,
          billedCount INT DEFAULT 0,
          currentCycleStart DATETIME,
          currentCycleEnd DATETIME,
          nextBillingDate DATETIME,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          cancelledAt DATETIME,
          INDEX idx_user (userId),
          INDEX idx_status (status),
          INDEX idx_order (razorpayOrderId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Add new columns if they don't exist (for existing databases)
      const alterQueries = [
        "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpayOrderId VARCHAR(100)",
        "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS razorpayPaymentId VARCHAR(100)",
        "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS customerName VARCHAR(200)",
        "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS customerEmail VARCHAR(200)",
        "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS customerContact VARCHAR(50)"
      ];
      
      for (const sql of alterQueries) {
        try {
          await connection.execute(sql);
        } catch (e) {
          // Ignore errors (column might already exist or syntax not supported)
        }
      }

      // Create invoices table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR(100) PRIMARY KEY,
          subscriptionId VARCHAR(100) NOT NULL,
          userId VARCHAR(100) NOT NULL,
          amount DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'INR',
          status VARCHAR(50) DEFAULT 'issued',
          razorpayPaymentId VARCHAR(100),
          razorpayInvoiceId VARCHAR(100),
          dueDate DATETIME,
          issuedDate DATETIME NOT NULL,
          paidDate DATETIME,
          failedDate DATETIME,
          description TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id) ON DELETE CASCADE,
          INDEX idx_subscription (subscriptionId),
          INDEX idx_user (userId),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create webhook logs table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS webhook_logs (
          id VARCHAR(100) PRIMARY KEY,
          eventId VARCHAR(100) NOT NULL UNIQUE,
          eventType VARCHAR(100) NOT NULL,
          data JSON,
          processed TINYINT DEFAULT 0,
          createdAt DATETIME NOT NULL,
          INDEX idx_event_type (eventType),
          INDEX idx_processed (processed)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create plans table to store synced Razorpay plans
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS plans (
          code VARCHAR(100) PRIMARY KEY,
          name VARCHAR(200) NOT NULL,
          amountPaise INT NOT NULL,
          currency VARCHAR(10) DEFAULT 'INR',
          planInterval INT DEFAULT 1,
          providerPlanId VARCHAR(100),
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          INDEX idx_provider_plan (providerPlanId)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      console.log('✅ Database schema initialized');
    } finally {
      connection.release();
    }
  }

  async createSubscription(userId, planCode, totalCount, razorpaySubscriptionId, extras = {}) {
    const id = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const cycleStart = now;
    const cycleEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const nextBillingDate = cycleEnd;
    const status = extras.status || 'pending';

    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO subscriptions 
         (id, userId, planCode, razorpaySubscriptionId, razorpayOrderId, customerName, customerEmail, customerContact, status, totalCount, currentCycleStart, currentCycleEnd, nextBillingDate, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId, planCode, razorpaySubscriptionId, 
          extras.razorpayOrderId || null,
          extras.customerName || null,
          extras.customerEmail || null,
          extras.customerContact || null,
          status, totalCount, cycleStart, cycleEnd, nextBillingDate, now, now
        ]
      );
      return this.getSubscription(id);
    } finally {
      connection.release();
    }
  }

  async getSubscription(subscriptionId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subscriptions WHERE id = ?',
        [subscriptionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getSubscriptionByUserId(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subscriptions WHERE userId = ? AND status = "active" LIMIT 1',
        [userId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getSubscriptionByOrderId(orderId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subscriptions WHERE razorpayOrderId = ? LIMIT 1',
        [orderId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async updateSubscription(subscriptionId, updates) {
    const now = new Date();
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(subscriptionId);

    const connection = await this.pool.getConnection();
    try {
      const sql = `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`;
      await connection.execute(sql, values);
      return this.getSubscription(subscriptionId);
    } finally {
      connection.release();
    }
  }

  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    const cancelledAt = new Date();
    const status = cancelAtPeriodEnd ? 'scheduled_for_cancellation' : 'cancelled';

    return this.updateSubscription(subscriptionId, {
      status,
      cancelledAt
    });
  }

  async createInvoice(subscriptionId, userId, amount, description = '') {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const dueDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO invoices 
         (id, subscriptionId, userId, amount, status, dueDate, issuedDate, description, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?)`,
        [id, subscriptionId, userId, amount, dueDate, now, description, now, now]
      );
      return this.getInvoice(id);
    } finally {
      connection.release();
    }
  }

  async getInvoice(invoiceId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM invoices WHERE id = ?',
        [invoiceId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getInvoicesBySubscription(subscriptionId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM invoices WHERE subscriptionId = ? ORDER BY issuedDate DESC',
        [subscriptionId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async getInvoicesByUser(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM invoices WHERE userId = ? ORDER BY issuedDate DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  async updateInvoice(invoiceId, updates) {
    const now = new Date();
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(invoiceId);

    const connection = await this.pool.getConnection();
    try {
      const sql = `UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`;
      await connection.execute(sql, values);
      return this.getInvoice(invoiceId);
    } finally {
      connection.release();
    }
  }

  async markInvoiceAsPaid(invoiceId, razorpayPaymentId) {
    return this.updateInvoice(invoiceId, {
      status: 'paid',
      razorpayPaymentId,
      paidDate: new Date()
    });
  }

  async logWebhook(eventId, eventType, data) {
    const id = `whlog_${Date.now()}`;
    const now = new Date();

    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO webhook_logs (id, eventId, eventType, data, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, eventId, eventType, JSON.stringify(data), now]
      );
    } finally {
      connection.release();
    }
  }

  async markWebhookProcessed(eventId) {
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        'UPDATE webhook_logs SET processed = 1 WHERE eventId = ?',
        [eventId]
      );
    } finally {
      connection.release();
    }
  }

  async getWebhookLog(eventId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM webhook_logs WHERE eventId = ?',
        [eventId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async getSubscriptionStats(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          COUNT(*) as totalSubscriptions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeSubscriptions,
          SUM(CASE WHEN status = 'scheduled_for_cancellation' THEN 1 ELSE 0 END) as scheduledForCancellation
         FROM subscriptions 
         WHERE userId = ?`,
        [userId]
      );
      return rows[0] || { totalSubscriptions: 0, activeSubscriptions: 0, scheduledForCancellation: 0 };
    } finally {
      connection.release();
    }
  }

  async getRevenueStats(startDate, endDate) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          COUNT(*) as totalInvoices,
          SUM(amount) as totalRevenue,
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paidRevenue,
          SUM(CASE WHEN status = 'issued' THEN amount ELSE 0 END) as pendingRevenue
         FROM invoices 
         WHERE issuedDate >= ? AND issuedDate <= ?`,
        [startDate, endDate]
      );
      return rows[0] || { totalInvoices: 0, totalRevenue: 0, paidRevenue: 0, pendingRevenue: 0 };
    } finally {
      connection.release();
    }
  }

  // Compatibility methods
  savePlan(planCode, providerPlanId) {
    return { code: planCode, providerPlanId };
  }

  getPlan(planCode) {
    return this.getPlanByCode(planCode);
  }

  saveSubscription(userId, subscription) {
    return subscription;
  }

  getSubscription(userId) {
    return this.getSubscriptionByUserId(userId);
  }

  getLatestSubscriptionForUser(userId) {
    return this.getSubscriptionByUserId(userId);
  }

  async getAllSubscriptionsForUser(userId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC',
        [userId]
      );
      return rows;
    } finally {
      connection.release();
    }
  }

  cancelSubscriptionByUserId(userId, subscriptionId, cancelAtPeriodEnd) {
    return this.cancelSubscription(subscriptionId, cancelAtPeriodEnd);
  }

  logWebhookEvent(eventId, eventType, data) {
    return this.logWebhook(eventId, eventType, data);
  }

  getWebhookEventStatus(eventId) {
    return this.getWebhookLog(eventId).then(log => 
      log ? { processed: log.processed === 1 } : null
    );
  }

  // Additional compatibility methods for BillingService
  async getPlanByCode(planCode) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM plans WHERE code = ?',
        [planCode]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async upsertPlan(plan) {
    const now = new Date();
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO plans (id, code, name, amountPaise, currency, planInterval, period, providerPlanId, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           name = VALUES(name),
           amountPaise = VALUES(amountPaise),
           currency = VALUES(currency),
           planInterval = VALUES(planInterval),
           period = VALUES(period),
           providerPlanId = VALUES(providerPlanId),
           updatedAt = VALUES(updatedAt)`,
        [id, plan.code, plan.name, plan.amountPaise, plan.currency || 'INR', plan.interval || 1, plan.period || 'monthly', plan.providerPlanId, now, now]
      );
      return this.getPlanByCode(plan.code);
    } finally {
      connection.release();
    }
  }

  async listPlans() {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute('SELECT * FROM plans');
      return rows;
    } finally {
      connection.release();
    }
  }

  async getSubscriptionById(subscriptionId) {
    return this.getSubscription(subscriptionId);
  }

  async getSubscriptionByProviderId(providerSubscriptionId) {
    const connection = await this.pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM subscriptions WHERE razorpaySubscriptionId = ? LIMIT 1',
        [providerSubscriptionId]
      );
      return rows[0] || null;
    } finally {
      connection.release();
    }
  }

  async hasProcessedEvent(eventId) {
    const log = await this.getWebhookLog(eventId);
    return log ? log.processed === 1 : false;
  }

  async markEventProcessed(eventId, eventType = 'unknown', data = null) {
    const id = `whlog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const connection = await this.pool.getConnection();
    try {
      // Use INSERT...ON DUPLICATE KEY UPDATE to handle both new and existing events
      await connection.execute(
        `INSERT INTO webhook_logs (id, eventId, eventType, data, processed, createdAt)
         VALUES (?, ?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE processed = 1`,
        [id, eventId, eventType, data ? JSON.stringify(data) : null, now]
      );
    } finally {
      connection.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ MySQL connection closed');
    }
  }
}
