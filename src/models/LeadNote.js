// models/LeadNote.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const LeadNote = sequelize.define('LeadNote', {
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
  note: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'lead_notes',
  timestamps: true,
  indexes: [
    { fields: ['leadId'] },
    { fields: ['userId'] },
    { fields: ['createdAt'] }
  ]
});

export { LeadNote };

