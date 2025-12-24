// Migration script to add email campaign support
// Run this script to add channelType and emailTemplateId columns to campaigns table

import { sequelize } from '../index.js';

const addCampaignEmailSupport = async () => {
  try {
    // Connect to database first
    await sequelize.authenticate();
    console.log('✅ Database connected');

    console.log('🔄 Adding email campaign support to campaigns table...');

    // Check if channelType column already exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'campaigns' 
      AND COLUMN_NAME = 'channelType'
    `);

    if (columns.length === 0) {
      // Add channelType column
      await sequelize.query(`
        ALTER TABLE \`campaigns\` 
        ADD COLUMN \`channelType\` ENUM('whatsapp', 'email') DEFAULT 'whatsapp' AFTER \`businessId\`
      `);
      console.log('✅ Added channelType column');
    } else {
      console.log('ℹ️  channelType column already exists');
    }

    // Check if emailTemplateId column already exists
    const [emailColumns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'campaigns' 
      AND COLUMN_NAME = 'emailTemplateId'
    `);

    if (emailColumns.length === 0) {
      // Add emailTemplateId column
      await sequelize.query(`
        ALTER TABLE \`campaigns\` 
        ADD COLUMN \`emailTemplateId\` INT NULL AFTER \`channelType\`
      `);
      console.log('✅ Added emailTemplateId column');
    } else {
      console.log('ℹ️  emailTemplateId column already exists');
    }

    // Add indexes for better performance
    try {
      await sequelize.query(`
        CREATE INDEX \`idx_campaigns_channel_type\` ON \`campaigns\` (\`channelType\`)
      `);
      console.log('✅ Added index on channelType');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Index on channelType already exists');
      } else {
        throw e;
      }
    }

    try {
      await sequelize.query(`
        CREATE INDEX \`idx_campaigns_email_template\` ON \`campaigns\` (\`emailTemplateId\`)
      `);
      console.log('✅ Added index on emailTemplateId');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Index on emailTemplateId already exists');
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
addCampaignEmailSupport();

