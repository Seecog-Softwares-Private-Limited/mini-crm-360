// Migration script to add birthday and anniversary fields to customers table
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

    // Check if dateOfBirth column already exists
    const [dobColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'customers' 
      AND COLUMN_NAME = 'dateOfBirth'
    `, [config.database]);

    if (dobColumns.length === 0) {
      console.log('Adding dateOfBirth and anniversaryDate columns...');
      await connection.execute(`
        ALTER TABLE \`customers\`
        ADD COLUMN \`dateOfBirth\` DATE NULL AFTER \`consentAt\`,
        ADD COLUMN \`anniversaryDate\` DATE NULL AFTER \`dateOfBirth\`
      `);
      console.log('✅ Added dateOfBirth and anniversaryDate columns');
    } else {
      console.log('✅ Columns dateOfBirth and anniversaryDate already exist');
    }

    // Check and add indexes
    try {
      await connection.execute(`
        CREATE INDEX \`idx_customers_dob\` ON \`customers\` (\`dateOfBirth\`)
      `);
      console.log('✅ Added index on dateOfBirth');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Index on dateOfBirth already exists');
      } else {
        throw e;
      }
    }

    try {
      await connection.execute(`
        CREATE INDEX \`idx_customers_anniversary\` ON \`customers\` (\`anniversaryDate\`)
      `);
      console.log('✅ Added index on anniversaryDate');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.message.includes('already exists')) {
        console.log('ℹ️  Index on anniversaryDate already exists');
      } else {
        throw e;
      }
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

