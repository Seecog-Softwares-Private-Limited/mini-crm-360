// src/models/PublishAttempt.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const PublishAttempt = sequelize.define('PublishAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postChannelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'social_post_channels',
      key: 'id'
    }
  },
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'success', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseData: {
    type: DataTypes.JSON,
    allowNull: true
  },
  attemptedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'publish_attempts',
  timestamps: false
});

export { PublishAttempt };

