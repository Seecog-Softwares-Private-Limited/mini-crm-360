// src/models/SocialPostChannel.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const SocialPostChannel = sequelize.define('SocialPostChannel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_posts',
      key: 'id'
    }
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_accounts',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'publishing', 'published', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  providerPostUrl: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  providerPostId: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'social_post_channels',
  timestamps: true
});

export { SocialPostChannel };

