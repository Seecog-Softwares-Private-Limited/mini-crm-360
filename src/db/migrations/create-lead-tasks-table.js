// Migration script to create lead_tasks table
import { sequelize } from '../index.js';

const createLeadTasksTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if table exists
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'lead_tasks'
    `);

    if (tables.length > 0) {
      console.log('ℹ️  lead_tasks table already exists');
      process.exit(0);
    }

    console.log('🔄 Creating lead_tasks table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`lead_tasks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`leadId\` INT NOT NULL,
        \`userId\` INT NOT NULL,
        \`assignedTo\` INT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`status\` ENUM('pending', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
        \`priority\` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
        \`dueDate\` DATETIME NULL,
        \`completedAt\` DATETIME NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_leadId\` (\`leadId\`),
        INDEX \`idx_userId\` (\`userId\`),
        INDEX \`idx_assignedTo\` (\`assignedTo\`),
        INDEX \`idx_status\` (\`status\`),
        INDEX \`idx_priority\` (\`priority\`),
        INDEX \`idx_dueDate\` (\`dueDate\`),
        INDEX \`idx_createdAt\` (\`createdAt\`),
        FOREIGN KEY (\`leadId\`) REFERENCES \`lead_records\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`assignedTo\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ lead_tasks table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create lead_tasks table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createLeadTasksTable();

