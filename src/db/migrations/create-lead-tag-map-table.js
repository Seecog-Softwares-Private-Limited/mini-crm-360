// Migration script to create lead_tag_map table (junction table)
import { sequelize } from '../index.js';

const createLeadTagMapTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'lead_tag_map'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  lead_tag_map table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating lead_tag_map table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`lead_tag_map\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`leadId\` INT NOT NULL,
        \`tagId\` INT NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_leadId\` (\`leadId\`),
        INDEX \`idx_tagId\` (\`tagId\`),
        UNIQUE KEY \`unique_lead_tag\` (\`leadId\`, \`tagId\`),
        FOREIGN KEY (\`leadId\`) REFERENCES \`lead_records\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`tagId\`) REFERENCES \`lead_tags\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ lead_tag_map table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create lead_tag_map table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createLeadTagMapTable();

