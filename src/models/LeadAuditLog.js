// models/LeadAuditLog.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const LeadAuditLog = sequelize.define('LeadAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lead_records',
      key: 'id'
    },
    onDelete: 'CASCADE'
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
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  oldValue: {
    type: DataTypes.JSON,
    allowNull: true
  },
  newValue: {
    type: DataTypes.JSON,
    allowNull: true
  },
  changes: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'lead_audit_logs',
  timestamps: true,
  createdAt: true,
  updatedAt: false,
  indexes: [
    { fields: ['leadId'] },
    { fields: ['userId'] },
    { fields: ['action'] },
    { fields: ['entityType'] },
    { fields: ['createdAt'] }
  ]
});

export { LeadAuditLog };

