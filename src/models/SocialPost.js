// src/models/SocialPost.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const SocialPost = sequelize.define('SocialPost', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'publishing', 'published', 'failed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  mediaUrls: {
    type: DataTypes.JSON,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'social_posts',
  timestamps: true
});

export { SocialPost };

