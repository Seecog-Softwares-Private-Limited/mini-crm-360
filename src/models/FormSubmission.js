// models/FormSubmission.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';
import { LeadForm } from './LeadForm.js';
import { Customer } from './Customer.js';

const FormSubmission = sequelize.define('FormSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  formId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lead_forms',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  submittedData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  utmSource: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  utmCampaign: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  utmMedium: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('new', 'processed', 'duplicate', 'spam'),
    allowNull: false,
    defaultValue: 'new'
  }
}, {
  tableName: 'form_submissions',
  timestamps: true,
  indexes: [
    { fields: ['formId'] },
    { fields: ['customerId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] }
  ]
});

// Note: Associations are defined in src/models/index.js

export { FormSubmission };

