// models/LeadForm.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const LeadForm = sequelize.define('LeadForm', {
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
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'businesses',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fields: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  successMessage: {
    type: DataTypes.STRING(500),
    allowNull: false,
    defaultValue: 'Thank you! We will contact you soon.'
  },
  redirectUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    allowNull: false,
    defaultValue: 'draft'
  },
  theme: {
    type: DataTypes.JSON,
    allowNull: true
  },
  leadSettings: {
    type: DataTypes.JSON,
    allowNull: true
  },
  successBehavior: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notifications: {
    type: DataTypes.JSON,
    allowNull: true
  },
  antiSpam: {
    type: DataTypes.JSON,
    allowNull: true
  },
  consentRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  consentText: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  analytics: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'lead_forms',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['slug'], unique: true },
    { fields: ['isActive'] }
  ]
});

// Note: Associations are defined in src/models/index.js to avoid circular dependencies

export { LeadForm };


