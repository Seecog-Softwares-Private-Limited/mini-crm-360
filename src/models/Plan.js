// src/models/Plan.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  yearlyPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: null
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'INR'
  },
  billingPeriod: {
    type: DataTypes.ENUM('monthly', 'yearly', 'lifetime', 'free'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  // Feature limits
  maxCustomers: {
    type: DataTypes.INTEGER,
    allowNull: true, // null means unlimited
    defaultValue: 50
  },
  maxBusinesses: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  maxEmailsPerMonth: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 100
  },
  maxWhatsAppMessagesPerMonth: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  // Feature flags
  hasEmailTemplates: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  hasWhatsAppTemplates: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hasInvoice: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hasAnalytics: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hasApiAccess: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hasCustomIntegrations: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hasPrioritySupport: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'plans',
  timestamps: true
});

export { Plan };

