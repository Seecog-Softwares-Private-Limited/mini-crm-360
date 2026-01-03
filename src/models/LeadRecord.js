// models/LeadRecord.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const LeadRecord = sequelize.define('LeadRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  submissionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: 'form_submissions',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'businesses',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  jobTitle: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  website: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'lost', 'archived'),
    allowNull: false,
    defaultValue: 'new'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  estimatedValue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: true,
    defaultValue: 'USD'
  },
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  customFields: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'lead_records',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['submissionId'], unique: true },
    { fields: ['businessId'] },
    { fields: ['customerId'] },
    { fields: ['status'] },
    { fields: ['priority'] },
    { fields: ['assignedTo'] },
    { fields: ['email'] },
    { fields: ['phone'] },
    { fields: ['createdAt'] },
    { fields: ['updatedAt'] }
  ]
});

export { LeadRecord };

