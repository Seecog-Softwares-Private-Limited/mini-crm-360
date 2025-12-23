// Migration script to create lead_forms table
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
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

    // Check if table already exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'lead_forms'
    `, [config.database]);

    if (tables.length === 0) {
      console.log('Creating lead_forms table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`lead_forms\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`userId\` INT NOT NULL,
          \`businessId\` INT NULL,
          \`name\` VARCHAR(255) NOT NULL,
          \`slug\` VARCHAR(255) NOT NULL UNIQUE,
          \`description\` TEXT NULL,
          \`fields\` JSON NOT NULL DEFAULT ('[]'),
          \`successMessage\` VARCHAR(500) DEFAULT 'Thank you! We will contact you soon.',
          \`redirectUrl\` VARCHAR(500) NULL,
          \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
          \`createdAt\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`businessId\`) REFERENCES \`businesses\`(\`id\`) ON DELETE SET NULL,
          INDEX \`idx_lead_forms_user\` (\`userId\`),
          INDEX \`idx_lead_forms_slug\` (\`slug\`),
          INDEX \`idx_lead_forms_active\` (\`isActive\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created lead_forms table');
    } else {
      console.log('✅ Table lead_forms already exists');
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

