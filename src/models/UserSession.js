// models/UserSession.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const UserSession = sequelize.define('UserSession', {
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
  sessionToken: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  deviceInfo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  browserInfo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_sessions',
  timestamps: true,
  updatedAt: 'lastActiveAt',
  indexes: [
    { fields: ['userId'] },
    { fields: ['sessionToken'] },
    { fields: ['isActive'] }
  ]
});

// Note: Associations are defined in src/models/index.js

export { UserSession };

