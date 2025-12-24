// src/db/migrations/add-timezone-column.js
import { sequelize } from '../index.js';

export const up = async () => {
  try {
    // Check if timezone column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'timezone'
    `);
    
    if (results.length === 0) {
      // Add timezone column if it doesn't exist
      await sequelize.query(`
        ALTER TABLE \`users\` 
        ADD COLUMN \`timezone\` VARCHAR(100) DEFAULT 'Asia/Kolkata' AFTER \`phone\`
      `);
      console.log('✅ Added timezone column');
    } else {
      console.log('⚠️ timezone column already exists');
    }

    console.log('✅ Timezone column migration completed');
  } catch (error) {
    console.error('❌ Error in up migration:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    await sequelize.query('ALTER TABLE `users` DROP COLUMN IF EXISTS `timezone`');
    console.log('✅ Timezone column migration rolled back');
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
