// Migration script to create lead_notes table
import { sequelize } from '../index.js';

const createLeadNotesTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'lead_notes'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  lead_notes table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating lead_notes table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`lead_notes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`leadId\` INT NOT NULL,
        \`userId\` INT NOT NULL,
        \`note\` TEXT NOT NULL,
        \`isPrivate\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_leadId\` (\`leadId\`),
        INDEX \`idx_userId\` (\`userId\`),
        INDEX \`idx_createdAt\` (\`createdAt\`),
        FOREIGN KEY (\`leadId\`) REFERENCES \`lead_records\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ lead_notes table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create lead_notes table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createLeadNotesTable();

