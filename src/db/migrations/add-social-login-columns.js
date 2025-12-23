// Migration script to add social login support to users table
// Run this script to add socialId and socialProvider columns

import { sequelize } from '../index.js';

const addSocialLoginColumns = async () => {
  try {
    // Connect to database first
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🔄 Adding social login support to users table...');

    // Check if socialId column already exists
    const [socialIdColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'socialId'
    `);

    if (socialIdColumns.length === 0) {
      // Add socialId column
      await sequelize.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`socialId\` VARCHAR(255) NULL AFTER \`refreshTokenExpiresAt\`
      `);
      console.log('✅ Added socialId column');
    } else {
      console.log('ℹ️  socialId column already exists');
    }

    // Check if socialProvider column already exists
    const [socialProviderColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'socialProvider'
    `);

    if (socialProviderColumns.length === 0) {
      // Add socialProvider column
      await sequelize.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`socialProvider\` VARCHAR(50) NULL AFTER \`socialId\`
      `);
      console.log('✅ Added socialProvider column');
    } else {
      console.log('ℹ️  socialProvider column already exists');
    }

    // Add indexes for better performance
    try {
      await sequelize.query(`
        CREATE INDEX \`idx_users_social_id\` ON \`users\` (\`socialId\`)
      `);
      console.log('✅ Added index on socialId');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Index on socialId already exists');
      } else {
        throw e;
      }
    }

    try {
      await sequelize.query(`
        CREATE INDEX \`idx_users_social_provider\` ON \`users\` (\`socialProvider\`)
      `);
      console.log('✅ Added index on socialProvider');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Index on socialProvider already exists');
      } else {
        throw e;
      }
    }

    try {
      await sequelize.query(`
        CREATE INDEX \`idx_users_social_lookup\` ON \`users\` (\`socialProvider\`, \`socialId\`)
      `);
      console.log('✅ Added composite index on socialProvider and socialId');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Composite index already exists');
      } else {
        throw e;
      }
    }

    console.log('✅ Migration completed successfully!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

// Run migration
addSocialLoginColumns();

