// Migration script to add yearlyPrice column to plans table
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

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

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'plans' 
      AND COLUMN_NAME = 'yearlyPrice'
    `, [config.database]);

    if (columns.length > 0) {
      console.log('✅ Column yearlyPrice already exists in plans table');
      return;
    }

    // Add yearlyPrice column
    console.log('Adding yearlyPrice column to plans table...');
    await connection.execute(`
      ALTER TABLE \`plans\`
      ADD COLUMN \`yearlyPrice\` DECIMAL(10, 2) NULL AFTER \`price\`
    `);
    console.log('✅ Added yearlyPrice column');

    // Update existing plans with yearly prices
    console.log('Updating yearly prices for existing plans...');
    await connection.execute(`
      UPDATE \`plans\` 
      SET \`yearlyPrice\` = CASE 
        WHEN \`slug\` = 'silver' THEN 9590.00
        WHEN \`slug\` = 'gold' THEN 28790.00
        ELSE NULL
      END
      WHERE \`slug\` IN ('silver', 'gold')
    `);
    console.log('✅ Updated yearly prices for Silver and Gold plans');

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


