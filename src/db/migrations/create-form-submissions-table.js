// Migration script to create form_submissions table if it doesn't exist
import { sequelize } from '../index.js';

const createFormSubmissionsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'form_submissions'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  form_submissions table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating form_submissions table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`form_submissions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`formId\` INT NOT NULL,
        \`customerId\` INT NULL,
        \`submittedData\` JSON NOT NULL,
        \`ipAddress\` VARCHAR(45) NULL,
        \`userAgent\` TEXT NULL,
        \`referrer\` VARCHAR(500) NULL,
        \`utmSource\` VARCHAR(255) NULL,
        \`utmCampaign\` VARCHAR(255) NULL,
        \`utmMedium\` VARCHAR(255) NULL,
        \`status\` ENUM('new', 'processed', 'duplicate', 'spam') NOT NULL DEFAULT 'new',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_formId\` (\`formId\`),
        INDEX \`idx_customerId\` (\`customerId\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_createdAt\` (\`createdAt\`),
        FOREIGN KEY (\`formId\`) REFERENCES \`lead_forms\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`customerId\`) REFERENCES \`customers\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ form_submissions table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create form_submissions table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createFormSubmissionsTable();

