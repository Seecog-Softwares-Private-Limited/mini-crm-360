// src/models/MenuItem.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Unique identifier for the menu item (e.g., "dashboard", "customers")'
  },
  label: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Display name of the menu item'
  },
  icon: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Font Awesome icon class (e.g., "fas fa-tachometer-alt")'
  },
  route: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Route path for the menu item (e.g., "/dashboard")'
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'If true, menu item is hidden/locked for all users'
  },
  requiresPlan: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Required plan slug to access this menu item (null = available to all)'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Order in which menu items are displayed'
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'crm_tools',
    comment: 'Menu category (e.g., "crm_tools", "utilities")'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Description of what this menu item does'
  }
}, {
  tableName: 'menu_items',
  timestamps: true
});

export { MenuItem };

