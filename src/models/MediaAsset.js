// src/models/MediaAsset.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../db/index.js';

const MediaAsset = sequelize.define('MediaAsset', {
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
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  originalFileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fileType: {
    type: DataTypes.ENUM('image', 'video', 'document'),
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'media_assets',
  timestamps: true
});

export { MediaAsset };

