// Migration script to create lead_audit_logs table
import { sequelize } from '../index.js';

const createLeadAuditLogsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'lead_audit_logs'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  lead_audit_logs table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating lead_audit_logs table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`lead_audit_logs\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`leadId\` INT NOT NULL,
        \`userId\` INT NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`entityType\` VARCHAR(50) NULL,
        \`entityId\` INT NULL,
        \`oldValue\` JSON NULL,
        \`newValue\` JSON NULL,
        \`changes\` JSON NULL,
        \`ipAddress\` VARCHAR(45) NULL,
        \`userAgent\` TEXT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_leadId\` (\`leadId\`),
        INDEX \`idx_userId\` (\`userId\`),
        INDEX \`idx_action\` (\`action\`),
        INDEX \`idx_entityType\` (\`entityType\`),
        INDEX \`idx_createdAt\` (\`createdAt\`),
        FOREIGN KEY (\`leadId\`) REFERENCES \`lead_records\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ lead_audit_logs table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create lead_audit_logs table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createLeadAuditLogsTable();

