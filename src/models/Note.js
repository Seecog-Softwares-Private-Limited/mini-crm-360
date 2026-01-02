// src/models/Note.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const Note = sequelize.define('Note', {
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
  type: {
    type: DataTypes.ENUM('note', 'campaign_sent', 'invoice_created', 'whatsapp_sent', 'email_sent', 'task_created', 'task_completed', 'customer_created', 'customer_updated'),
    allowNull: false,
    defaultValue: 'note'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'notes_timeline',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['customerId'] },
    { fields: ['type'] },
    { fields: ['createdAt'] },
    { fields: ['customerId', 'createdAt'] }
  ]
});

export { Note };


