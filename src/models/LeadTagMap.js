// models/LeadTagMap.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const LeadTagMap = sequelize.define('LeadTagMap', {
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
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'lead_tags',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'lead_tag_map',
  timestamps: true,
  createdAt: true,
  updatedAt: false,
  indexes: [
    { fields: ['leadId'] },
    { fields: ['tagId'] },
    { fields: ['leadId', 'tagId'], unique: true }
  ]
});

export { LeadTagMap };

