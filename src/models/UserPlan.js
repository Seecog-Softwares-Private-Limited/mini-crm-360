// src/models/UserPlan.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const UserPlan = sequelize.define('UserPlan', {
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
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plans',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'cancelled', 'trial'),
    allowNull: false,
    defaultValue: 'trial'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true // null for lifetime/free plans
  },
  isCurrent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'user_plans',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['planId'] },
    { fields: ['userId', 'isCurrent'] },
    { unique: true, fields: ['userId', 'isCurrent'], where: { isCurrent: true } }
  ]
});

// Note: Associations are defined in src/models/index.js to avoid circular dependencies

export { UserPlan };


