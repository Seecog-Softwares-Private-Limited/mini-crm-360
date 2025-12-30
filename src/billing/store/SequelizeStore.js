// src/billing/store/SequelizeStore.js
/**
 * Sequelize-based store adapter for the billing module.
 * Integrates with existing mini-CRM models (Plan, UserPlan, User).
 */

import { sequelize } from '../../db/index.js';
import { DataTypes, Op } from 'sequelize';
import { BILLING_STATUS, PAYMENT_STATUS } from '../constants/billing.constant.js';

// Define additional models needed for billing
// These will be created if they don't exist

// Payment Logs table
const PaymentLog = sequelize.define('PaymentLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'INR'
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payment_logs',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['razorpayOrderId'] },
    { fields: ['status'] }
  ]
});

// Invoices table
const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userPlanId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'INR'
  },
  razorpayOrderId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  razorpayInvoiceId: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('issued', 'paid', 'failed', 'refunded'),
    allowNull: false,
    defaultValue: 'issued'
  },
  billingCycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'invoices',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['razorpayOrderId'] },
    { fields: ['razorpayPaymentId'] }
  ]
});

// Webhook Logs table
const WebhookLog = sequelize.define('WebhookLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  eventType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  processed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'webhook_logs',
  timestamps: true,
  indexes: [
    { fields: ['eventId'] },
    { fields: ['eventType'] },
    { fields: ['processed'] }
  ]
});

// Subscriptions table (for Razorpay recurring subscriptions)
const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  razorpaySubscriptionId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'past_due', 'cancelled', 'expired'),
    allowNull: false,
    defaultValue: 'pending'
  },
  totalCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 12
  },
  billedCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  currentCycleStart: {
    type: DataTypes.DATE,
    allowNull: true
  },
  currentCycleEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['razorpaySubscriptionId'] },
    { fields: ['status'] }
  ]
});

// Razorpay Plan Mapping table (maps our plans to Razorpay plan IDs)
const RazorpayPlanMapping = sequelize.define('RazorpayPlanMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  razorpayPlanId: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'razorpay_plan_mappings',
  timestamps: true
});

export class SequelizeStore {
  constructor() {
    this.initialized = false;
    this.Plan = null;
    this.UserPlan = null;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Dynamically import Plan and UserPlan to avoid circular dependency
      const { Plan } = await import('../../models/Plan.js');
      const { UserPlan } = await import('../../models/UserPlan.js');
      this.Plan = Plan;
      this.UserPlan = UserPlan;

      // Sync tables (create if not exist)
      await PaymentLog.sync({ alter: false });
      await Invoice.sync({ alter: false });
      await WebhookLog.sync({ alter: false });
      await Subscription.sync({ alter: false });
      await RazorpayPlanMapping.sync({ alter: false });
      
      this.initialized = true;
      console.log('✅ Billing tables synchronized');
    } catch (error) {
      console.error('Failed to sync billing tables:', error);
      // Don't throw - allow app to continue even if sync fails
      // Tables might already exist with different structure
      this.initialized = true;
    }
  }

  // ========== PLANS ==========

  async listPlans() {
    if (!this.Plan) await this.initialize();
    return this.Plan.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['price', 'ASC']],
      raw: true
    });
  }

  async getPlanById(planId) {
    if (!this.Plan) await this.initialize();
    return this.Plan.findByPk(planId, { raw: true });
  }

  async getPlanBySlug(planSlug) {
    if (!this.Plan) await this.initialize();
    return this.Plan.findOne({
      where: { slug: planSlug, isActive: true },
      raw: true
    });
  }

  // ========== USER PLANS ==========

  async getUserCurrentPlan(userId) {
    if (!this.UserPlan || !this.Plan) await this.initialize();
    const userPlan = await this.UserPlan.findOne({
      where: { userId, isCurrent: true },
      include: [{ model: this.Plan, as: 'plan' }],
      order: [['createdAt', 'DESC']]
    });
    return userPlan;
  }

  async getUserPlanByOrderId(orderId) {
    if (!this.UserPlan) await this.initialize();
    // Find payment log with this order ID and get associated plan
    const paymentLog = await PaymentLog.findOne({
      where: { razorpayOrderId: orderId, status: 'completed' },
      raw: true
    });
    if (!paymentLog) return null;

    return this.UserPlan.findOne({
      where: { userId: paymentLog.userId, planId: paymentLog.planId },
      order: [['createdAt', 'DESC']],
      raw: true
    });
  }

  async activateUserPlan({ userId, planId, startDate, endDate, razorpayOrderId, razorpayPaymentId, razorpaySubscriptionId }) {
    if (!this.UserPlan) await this.initialize();
    // Deactivate current plan
    await this.UserPlan.update(
      { isCurrent: false },
      { where: { userId, isCurrent: true } }
    );

    // Create new user plan
    const userPlan = await this.UserPlan.create({
      userId,
      planId,
      status: 'active',
      startDate,
      endDate,
      isCurrent: true
    });

    return userPlan.get({ plain: true });
  }

  // ========== PAYMENT LOGS ==========

  async createPaymentLog({ userId, planId, razorpayOrderId, amount, currency, billingCycle, status, metadata }) {
    const log = await PaymentLog.create({
      userId,
      planId,
      razorpayOrderId,
      amount,
      currency,
      billingCycle,
      status,
      metadata
    });
    return log.get({ plain: true });
  }

  async updatePaymentLogByOrderId(orderId, updates) {
    await PaymentLog.update(updates, {
      where: { razorpayOrderId: orderId }
    });
  }

  async getPaymentLogByOrderId(orderId) {
    return PaymentLog.findOne({
      where: { razorpayOrderId: orderId },
      raw: true
    });
  }

  // ========== INVOICES ==========

  async createInvoice({ userId, planId, userPlanId, amount, currency, razorpayOrderId, razorpayPaymentId, status, paidAt, dueDate, billingCycle, description }) {
    const invoice = await Invoice.create({
      userId,
      planId,
      userPlanId,
      amount,
      currency,
      razorpayOrderId,
      razorpayPaymentId,
      status,
      paidAt,
      billingCycle,
      description,
      dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // Use provided dueDate or fallback to 15 days
    });
    return invoice.get({ plain: true });
  }

  async getUserInvoices(userId, limit = 20) {
    return Invoice.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [{ model: Plan, as: 'plan', required: false }],
      raw: true,
      nest: true
    });
  }

  async getInvoiceById(invoiceId) {
    return Invoice.findByPk(invoiceId, { raw: true });
  }

  // ========== WEBHOOK LOGS ==========

  async logWebhook(eventId, eventType, data) {
    try {
      await WebhookLog.create({
        eventId,
        eventType,
        data,
        processed: true
      });
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message?.includes('Duplicate') && !error.message?.includes('unique')) {
        console.error('Error logging webhook:', error);
      }
    }
  }

  async hasProcessedEvent(eventId) {
    const log = await WebhookLog.findOne({
      where: { eventId },
      raw: true
    });
    return log?.processed === true;
  }

  async markEventProcessed(eventId, eventType, data) {
    try {
      await WebhookLog.upsert({
        eventId,
        eventType,
        data,
        processed: true
      });
    } catch (error) {
      console.error('Error marking event processed:', error);
    }
  }

  // ========== SUBSCRIPTIONS (Razorpay recurring) ==========

  async createSubscription({ userId, planId, razorpaySubscriptionId, status, totalCount, currentCycleStart, currentCycleEnd }) {
    const subscription = await Subscription.create({
      userId,
      planId,
      razorpaySubscriptionId,
      status,
      totalCount,
      currentCycleStart,
      currentCycleEnd
    });
    return subscription.get({ plain: true });
  }

  async getSubscriptionById(subscriptionId) {
    return Subscription.findByPk(subscriptionId, { raw: true });
  }

  async getActiveSubscription(userId) {
    return Subscription.findOne({
      where: { userId, status: 'active' },
      order: [['createdAt', 'DESC']],
      raw: true
    });
  }

  async updateSubscription(subscriptionId, updates) {
    await Subscription.update(updates, {
      where: { id: subscriptionId }
    });
  }

  async updateSubscriptionByRazorpayId(razorpaySubscriptionId, updates) {
    await Subscription.update(updates, {
      where: { razorpaySubscriptionId }
    });
  }

  // ========== RAZORPAY PLAN MAPPING ==========

  async getRazorpayPlanId(planId) {
    const mapping = await RazorpayPlanMapping.findOne({
      where: { planId },
      raw: true
    });
    return mapping?.razorpayPlanId || null;
  }

  async setRazorpayPlanId(planId, razorpayPlanId) {
    await RazorpayPlanMapping.upsert({
      planId,
      razorpayPlanId
    });
  }
}

// Export models for use in other parts of the app
export { PaymentLog, Invoice, WebhookLog, Subscription, RazorpayPlanMapping };
