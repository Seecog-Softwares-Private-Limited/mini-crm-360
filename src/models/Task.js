// src/models/Task.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Task = sequelize.define('Task', {
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
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'customers',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('call', 'meeting', 'payment_followup', 'other'),
    allowNull: false,
    defaultValue: 'other'
  },
  status: {
    type: DataTypes.ENUM('pending', 'done', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  reminderDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isReminderSent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium'
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['customerId'] },
    { fields: ['status'] },
    { fields: ['dueDate'] },
    { fields: ['userId', 'status'] }
  ]
});

export { Task };


