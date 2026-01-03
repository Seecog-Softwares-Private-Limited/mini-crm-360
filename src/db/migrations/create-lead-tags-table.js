// Migration script to create lead_tags table
import { sequelize } from '../index.js';

const createLeadTagsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'lead_tags'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  lead_tags table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating lead_tags table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`lead_tags\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`userId\` INT NOT NULL,
        \`name\` VARCHAR(100) NOT NULL,
        \`color\` VARCHAR(7) NULL DEFAULT '#667eea',
        \`description\` TEXT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_userId\` (\`userId\`),
        INDEX \`idx_name\` (\`name\`),
        UNIQUE KEY \`unique_user_tag\` (\`userId\`, \`name\`),
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ lead_tags table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create lead_tags table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createLeadTagsTable();

