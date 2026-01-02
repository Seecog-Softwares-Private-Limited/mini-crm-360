// src/models/SocialAuditLog.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const SocialAuditLog = sequelize.define('SocialAuditLog', {
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
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'social_audit_logs',
  timestamps: true,
  updatedAt: false
});

export { SocialAuditLog };

