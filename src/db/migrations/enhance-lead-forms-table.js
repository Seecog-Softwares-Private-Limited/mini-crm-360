// Migration script to enhance lead_forms table
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../property.env') });

const getDbConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'prod' || nodeEnv === 'production';

  if (isProduction) {
    return {
      host: process.env.DB_HOST_PROD || process.env.DB_HOST,
      port: Number(process.env.DB_PORT_PROD || process.env.DB_PORT || 3306),
      database: process.env.DB_NAME_PROD || process.env.DB_NAME || "saas_whatsapp_manager",
      user: process.env.DB_USER_PROD || process.env.DB_USER,
      password: process.env.DB_PASSWORD_PROD || process.env.DB_PASSWORD,
    };
  } else {
    return {
      host: process.env.DB_HOST_STAGE || process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT_STAGE || process.env.DB_PORT || 3306),
      database: process.env.DB_NAME_STAGE || process.env.DB_NAME || "saas_whatsapp_manager",
      user: process.env.DB_USER_STAGE || process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD_STAGE || process.env.DB_PASSWORD || '',
    };
  }
};

async function runMigration() {
  let connection;
  try {
    const config = getDbConfig();
    console.log('Connecting to database:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user
    });

    connection = await mysql.createConnection(config);

    // Check and add new columns to lead_forms
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'lead_forms' 
      AND COLUMN_NAME = 'status'
    `, [config.database]);

    if (columns.length === 0) {
      console.log('Adding new columns to lead_forms table...');
      await connection.execute(`
        ALTER TABLE \`lead_forms\`
        ADD COLUMN \`status\` ENUM('draft', 'published') DEFAULT 'draft' AFTER \`isActive\`,
        ADD COLUMN \`theme\` JSON NULL AFTER \`redirectUrl\`,
        ADD COLUMN \`leadSettings\` JSON NULL AFTER \`theme\`,
        ADD COLUMN \`successBehavior\` JSON NULL AFTER \`leadSettings\`,
        ADD COLUMN \`notifications\` JSON NULL AFTER \`successBehavior\`,
        ADD COLUMN \`antiSpam\` JSON NULL AFTER \`notifications\`,
        ADD COLUMN \`consentRequired\` BOOLEAN DEFAULT FALSE AFTER \`antiSpam\`,
        ADD COLUMN \`consentText\` VARCHAR(500) NULL AFTER \`consentRequired\`,
        ADD COLUMN \`analytics\` JSON NULL AFTER \`consentText\`
      `);
      console.log('✅ Added new columns to lead_forms');
    } else {
      console.log('✅ New columns already exist in lead_forms');
    }

    // Check and create form_submissions table
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'form_submissions'
    `, [config.database]);

    if (tables.length === 0) {
      console.log('Creating form_submissions table...');
      await connection.execute(`
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
          \`status\` ENUM('new', 'processed', 'duplicate', 'spam') DEFAULT 'new',
          \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`formId\`) REFERENCES \`lead_forms\`(\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE SET NULL,
          INDEX \`idx_submissions_form\` (\`formId\`),
          INDEX \`idx_submissions_customer\` (\`customerId\`),
          INDEX \`idx_submissions_status\` (\`status\`),
          INDEX \`idx_submissions_created\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created form_submissions table');
    } else {
      console.log('✅ form_submissions table already exists');
    }

    console.log('✅ Migration completed successfully');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });


