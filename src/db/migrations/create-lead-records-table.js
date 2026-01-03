// Migration script to create lead_records table
import { sequelize } from '../index.js';

const createLeadRecordsTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'lead_records'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  lead_records table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating lead_records table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`lead_records\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`userId\` INT NOT NULL,
        \`submissionId\` INT NULL,
        \`businessId\` INT NULL,
        \`customerId\` INT NULL,
        \`firstName\` VARCHAR(100) NULL,
        \`lastName\` VARCHAR(100) NULL,
        \`email\` VARCHAR(255) NULL,
        \`phone\` VARCHAR(20) NULL,
        \`company\` VARCHAR(255) NULL,
        \`jobTitle\` VARCHAR(255) NULL,
        \`website\` VARCHAR(500) NULL,
        \`source\` VARCHAR(100) NULL,
        \`status\` ENUM('new', 'contacted', 'qualified', 'converted', 'lost', 'archived') NOT NULL DEFAULT 'new',
        \`priority\` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        \`score\` INT NULL DEFAULT 0,
        \`estimatedValue\` DECIMAL(15, 2) NULL,
        \`currency\` VARCHAR(3) NULL DEFAULT 'USD',
        \`assignedTo\` INT NULL,
        \`customFields\` JSON NULL,
        \`notes\` TEXT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_userId\` (\`userId\`),
        INDEX \`idx_submissionId\` (\`submissionId\`),
        INDEX \`idx_businessId\` (\`businessId\`),
        INDEX \`idx_customerId\` (\`customerId\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_priority\` (\`priority\`),
        INDEX \`idx_assignedTo\` (\`assignedTo\`),
        INDEX \`idx_email\` (\`email\`),
        INDEX \`idx_phone\` (\`phone\`),
        INDEX \`idx_createdAt\` (\`createdAt\`),
        INDEX \`idx_updatedAt\` (\`updatedAt\`),
        UNIQUE KEY \`unique_submission\` (\`submissionId\`),
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`submissionId\`) REFERENCES \`form_submissions\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`businessId\`) REFERENCES \`businesses\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`customerId\`) REFERENCES \`customers\` (\`id\`) ON DELETE SET NULL,
        FOREIGN KEY (\`assignedTo\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ lead_records table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create lead_records table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createLeadRecordsTable();

