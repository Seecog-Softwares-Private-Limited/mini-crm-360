// src/models/PlanMenuItem.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const PlanMenuItem = sequelize.define('PlanMenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'plans',
      key: 'id'
    },
    comment: 'Reference to the plan'
  },
  menuItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id'
    },
    comment: 'Reference to the menu item'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'If true, this menu item is locked for this plan'
  }
}, {
  tableName: 'plan_menu_items',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['planId', 'menuItemId'],
      name: 'unique_plan_menu_item'
    }
  ]
});

export { PlanMenuItem };

