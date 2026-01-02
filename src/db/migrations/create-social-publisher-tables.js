// src/db/migrations/create-social-publisher-tables.js
import { sequelize } from '../index.js';

async function createSocialPublisherTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    const queryInterface = sequelize.getQueryInterface();

    // 1. Social Accounts Table
    await queryInterface.createTable('social_accounts', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      businessId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      platform: {
        type: sequelize.Sequelize.ENUM('facebook', 'linkedin', 'twitter', 'instagram', 'whatsapp'),
        allowNull: false
      },
      accountType: {
        type: sequelize.Sequelize.ENUM('page', 'profile', 'group', 'business'),
        allowNull: false,
        defaultValue: 'profile'
      },
      accountName: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false
      },
      accountId: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false,
        comment: 'Platform-specific account ID'
      },
      accessToken: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true,
        comment: 'Encrypted access token'
      },
      refreshToken: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true,
        comment: 'Encrypted refresh token'
      },
      tokenExpiresAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      },
      isActive: {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastSyncAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      },
      metadata: {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        comment: 'Platform-specific metadata (avatar, followers, etc.)'
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 2. Social Posts Table
    await queryInterface.createTable('social_posts', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      businessId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true
      },
      content: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: sequelize.Sequelize.ENUM('draft', 'scheduled', 'publishing', 'published', 'failed'),
        allowNull: false,
        defaultValue: 'draft'
      },
      scheduledAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true,
        comment: 'When to publish (null for draft)'
      },
      publishedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true,
        comment: 'Actual publish time'
      },
      templateId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        comment: 'Reference to template used'
      },
      mediaUrls: {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        comment: 'Array of media URLs'
      },
      metadata: {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        comment: 'Additional post metadata'
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 3. Social Post Channels Table (Many-to-Many: Posts -> Accounts)
    await queryInterface.createTable('social_post_channels', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      postId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'social_posts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      accountId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'social_accounts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: sequelize.Sequelize.ENUM('pending', 'publishing', 'published', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      scheduledAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      },
      publishedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      },
      providerPostUrl: {
        type: sequelize.Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL of post on platform'
      },
      providerPostId: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true,
        comment: 'Platform-specific post ID'
      },
      errorMessage: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 4. Media Assets Table
    await queryInterface.createTable('media_assets', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      businessId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      fileName: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false
      },
      originalFileName: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false
      },
      filePath: {
        type: sequelize.Sequelize.STRING(500),
        allowNull: false
      },
      fileUrl: {
        type: sequelize.Sequelize.STRING(500),
        allowNull: false
      },
      fileType: {
        type: sequelize.Sequelize.ENUM('image', 'video', 'document'),
        allowNull: false
      },
      mimeType: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: false
      },
      fileSize: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        comment: 'Size in bytes'
      },
      width: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        comment: 'Image/video width'
      },
      height: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        comment: 'Image/video height'
      },
      metadata: {
        type: sequelize.Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 5. Publish Attempts Table (for retry tracking)
    await queryInterface.createTable('publish_attempts', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      postChannelId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'social_post_channels',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      attemptNumber: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      status: {
        type: sequelize.Sequelize.ENUM('pending', 'processing', 'success', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      errorMessage: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      },
      responseData: {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        comment: 'Provider response data'
      },
      attemptedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      },
      completedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      }
    });

    // 6. Social Templates Table
    await queryInterface.createTable('social_templates', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        comment: 'null for system templates'
      },
      businessId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'businesses',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      name: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false
      },
      category: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: true,
        comment: 'e.g., festival, promotion, announcement'
      },
      content: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false
      },
      mediaUrls: {
        type: sequelize.Sequelize.JSON,
        allowNull: true
      },
      tags: {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        comment: 'Array of tags'
      },
      isSystem: {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      isActive: {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 7. Audit Logs Table (for social publisher actions)
    await queryInterface.createTable('social_audit_logs', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      action: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: false,
        comment: 'e.g., post_created, post_published, account_connected'
      },
      entityType: {
        type: sequelize.Sequelize.STRING(50),
        allowNull: false,
        comment: 'e.g., post, account, template'
      },
      entityId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: true
      },
      details: {
        type: sequelize.Sequelize.JSON,
        allowNull: true
      },
      ipAddress: {
        type: sequelize.Sequelize.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: sequelize.Sequelize.STRING(500),
        allowNull: true
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('social_accounts', ['userId', 'platform']);
    await queryInterface.addIndex('social_accounts', ['isActive']);
    await queryInterface.addIndex('social_posts', ['userId', 'status']);
    await queryInterface.addIndex('social_posts', ['scheduledAt']);
    await queryInterface.addIndex('social_posts', ['status']);
    await queryInterface.addIndex('social_post_channels', ['postId']);
    await queryInterface.addIndex('social_post_channels', ['accountId']);
    await queryInterface.addIndex('social_post_channels', ['status']);
    await queryInterface.addIndex('publish_attempts', ['postChannelId']);
    await queryInterface.addIndex('media_assets', ['userId']);
    await queryInterface.addIndex('social_templates', ['userId', 'isActive']);
    await queryInterface.addIndex('social_audit_logs', ['userId', 'action']);

    console.log('\n✅ Social Publisher tables created successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating social publisher tables:', error);
    process.exit(1);
  }
}

createSocialPublisherTables();

