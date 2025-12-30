// Migration script to add profile fields to users table
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

    // Check and add new columns to users table
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'avatar'
    `, [config.database]);

    if (columns.length === 0) {
      console.log('Adding new profile columns to users table...');
      await connection.execute(`
        ALTER TABLE \`users\`
        ADD COLUMN \`avatar\` VARCHAR(500) NULL AFTER \`lastName\`,
        ADD COLUMN \`phone\` VARCHAR(20) NULL AFTER \`avatar\`,
        ADD COLUMN \`timezone\` VARCHAR(100) DEFAULT 'Asia/Kolkata' AFTER \`phone\`,
        ADD COLUMN \`language\` VARCHAR(10) DEFAULT 'en' AFTER \`timezone\`,
        ADD COLUMN \`notificationPreferences\` JSON NULL AFTER \`language\`,
        ADD COLUMN \`twoFactorEnabled\` BOOLEAN DEFAULT FALSE AFTER \`notificationPreferences\`,
        ADD COLUMN \`twoFactorSecret\` VARCHAR(255) NULL AFTER \`twoFactorEnabled\`
      `);
      console.log('✅ Added new profile columns to users');
    } else {
      console.log('✅ Profile columns already exist in users');
    }

    // Create user_sessions table
    const [sessionsTable] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'user_sessions'
    `, [config.database]);

    if (sessionsTable.length === 0) {
      console.log('Creating user_sessions table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`user_sessions\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`userId\` INT NOT NULL,
          \`sessionToken\` VARCHAR(255) NOT NULL UNIQUE,
          \`deviceInfo\` VARCHAR(255) NULL,
          \`browserInfo\` VARCHAR(255) NULL,
          \`ipAddress\` VARCHAR(45) NULL,
          \`location\` VARCHAR(255) NULL,
          \`isActive\` BOOLEAN DEFAULT TRUE,
          \`lastActiveAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
          INDEX \`idx_user_sessions_user\` (\`userId\`),
          INDEX \`idx_user_sessions_token\` (\`sessionToken\`),
          INDEX \`idx_user_sessions_active\` (\`isActive\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created user_sessions table');
    } else {
      console.log('✅ user_sessions table already exists');
    }

    // Create activity_logs table
    const [activityTable] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'activity_logs'
    `, [config.database]);

    if (activityTable.length === 0) {
      console.log('Creating activity_logs table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`activity_logs\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`userId\` INT NOT NULL,
          \`action\` VARCHAR(100) NOT NULL,
          \`description\` TEXT NULL,
          \`ipAddress\` VARCHAR(45) NULL,
          \`userAgent\` TEXT NULL,
          \`metadata\` JSON NULL,
          \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
          INDEX \`idx_activity_logs_user\` (\`userId\`),
          INDEX \`idx_activity_logs_action\` (\`action\`),
          INDEX \`idx_activity_logs_created\` (\`createdAt\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created activity_logs table');
    } else {
      console.log('✅ activity_logs table already exists');
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

