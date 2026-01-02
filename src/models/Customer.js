// models/Customer.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';      // <-- add this

import { Business } from './Business.js';
const Customer = sequelize.define('Customer', {

  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER, allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true, // your migration note
    references: { model: 'businesses', key: 'id' }
  },
  name: { type: DataTypes.STRING, allowNull: true },

  email: {
    type: DataTypes.STRING(120),
    allowNull: true,
    validate: { isEmail: true },
  },
  phoneE164: {
    type: DataTypes.STRING, allowNull: false,
    validate: { is: /^\+\d{8,15}$/ }
  },

  whatsappE164: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: { is: /^\+\d{8,15}$/ },
  },

  // 🔥 NEW FIELDS
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  anniversaryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },

  tags: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  consentAt: { type: DataTypes.DATE, allowNull: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
  anniversaryDate: { type: DataTypes.DATEONLY, allowNull: true }
}, {
  tableName: 'customers',
  timestamps: true,
  indexes: [{ unique: true, fields: ['userId', 'phoneE164'] }]
});



export { Customer };

