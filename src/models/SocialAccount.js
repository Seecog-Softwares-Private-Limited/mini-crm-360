// src/models/SocialAccount.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const SocialAccount = sequelize.define('SocialAccount', {
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
  businessId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'businesses',
      key: 'id'
    }
  },
  platform: {
    type: DataTypes.ENUM('facebook', 'linkedin', 'twitter', 'instagram', 'whatsapp'),
    allowNull: false
  },
  accountType: {
    type: DataTypes.ENUM('page', 'profile', 'group', 'business'),
    allowNull: false,
    defaultValue: 'profile'
  },
  accountName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  accountId: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  accessToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tokenExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  lastSyncAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'social_accounts',
  timestamps: true
});

export { SocialAccount };

