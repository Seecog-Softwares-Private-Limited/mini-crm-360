// models/LeadTag.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const LeadTag = sequelize.define('LeadTag', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: true,
    defaultValue: '#667eea'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'lead_tags',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['name'] },
    { fields: ['userId', 'name'], unique: true }
  ]
});

export { LeadTag };

