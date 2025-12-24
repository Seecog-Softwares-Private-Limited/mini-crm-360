// src/db/migrations/add-phone-column.js
import { sequelize } from '../index.js';

export const up = async () => {
  try {
    // Check if phone column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'phone'
    `);
    
    if (results.length === 0) {
      // Add phone column if it doesn't exist
      await sequelize.query(`
        ALTER TABLE \`users\` 
        ADD COLUMN \`phone\` VARCHAR(20) NULL AFTER \`avatar\`
      `);
      console.log('✅ Added phone column');
    } else {
      console.log('⚠️ phone column already exists');
    }

    console.log('✅ Phone column migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `phone`');
    console.log('✅ Phone column migration rolled back');
  } catch (error) {
    console.error('❌ Error in down migration:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
