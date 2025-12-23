// Migration script to create notes_timeline table
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
      AND TABLE_NAME = 'notes_timeline'
    `, [config.database]);

    if (tables.length > 0) {
      console.log('✅ Table notes_timeline already exists');
      return;
    }

    // Create notes_timeline table
    console.log('Creating notes_timeline table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`notes_timeline\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`userId\` INT NOT NULL,
        \`customerId\` INT NOT NULL,
        \`type\` ENUM('note', 'campaign_sent', 'invoice_created', 'whatsapp_sent', 'email_sent', 'task_created', 'task_completed', 'customer_created', 'customer_updated') NOT NULL DEFAULT 'note',
        \`title\` VARCHAR(255) NULL,
        \`content\` TEXT NULL,
        \`metadata\` JSON NULL,
        \`createdBy\` INT NULL COMMENT 'User ID who created this entry (null for auto-logged events)',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`customerId\`) REFERENCES \`customers\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`createdBy\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        INDEX \`idx_notes_user\` (\`userId\`),
        INDEX \`idx_notes_customer\` (\`customerId\`),
        INDEX \`idx_notes_type\` (\`type\`),
        INDEX \`idx_notes_created_at\` (\`createdAt\`),
        INDEX \`idx_notes_customer_created\` (\`customerId\`, \`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created notes_timeline table');

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

