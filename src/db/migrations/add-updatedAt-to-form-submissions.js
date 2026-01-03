// Migration script to add updatedAt column to form_submissions table
import { sequelize } from '../index.js';

const addUpdatedAtColumn = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if updatedAt column exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'form_submissions' 
      AND COLUMN_NAME = 'updatedAt'
    `);

    if (columns.length > 0) {
      console.log('ℹ️  updatedAt column already exists');
      process.exit(0);
    }

    console.log('🔄 Adding updatedAt column to form_submissions table...');

    await sequelize.query(`
      ALTER TABLE \`form_submissions\` 
      ADD COLUMN \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER \`createdAt\`
    `);

    console.log('✅ updatedAt column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to add updatedAt column:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

addUpdatedAtColumn();

